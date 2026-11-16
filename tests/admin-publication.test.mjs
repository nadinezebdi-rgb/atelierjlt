import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { SourceTextModule, SyntheticModule } from 'node:vm'
import { isPublishedProduct, publicationErrors } from '../lib/product-publication.js'
import { adminRequest } from '../lib/admin-request.js'

const valid = { slug: 'coussin', name: 'Coussin', price: 45, stock: 2, category: 'intemporels', images: ['/api/img/coussin'] }
const NextResponse = { json: (body, options = {}) => ({ body, status: options.status || 200 }) }

async function moduleWithMocks(path, dependencies) {
  const module = new SourceTextModule(await readFile(new URL(path, import.meta.url), 'utf8'))
  await module.link((specifier) => {
    const values = dependencies[specifier]
    assert.ok(values, `Missing mock: ${specifier}`)
    return new SyntheticModule(Object.keys(values), function () {
      for (const [key, value] of Object.entries(values)) this.setExport(key, value)
    })
  })
  await module.evaluate()
  return module.namespace
}

test('existing products remain published, explicit drafts are private', () => {
  assert.equal(isPublishedProduct(valid), true)
  assert.equal(isPublishedProduct({ ...valid, published: true }), true)
  assert.equal(isPublishedProduct({ ...valid, published: false }), false)
})

test('publication requires a real name, price, photo, integer stock and collection', () => {
  assert.deepEqual(publicationErrors(valid), [])
  for (const patch of [
    { name: 'Nouvelle création' }, { name: '' }, { name: {} }, { name: 42 }, { price: 0 }, { price: -1 }, { price: NaN },
    { images: [] }, { images: [' '] }, { stock: -1 }, { stock: 1.5 }, { category: 'invalid' },
  ]) assert.ok(publicationErrors({ ...valid, ...patch }).length, JSON.stringify(patch))
  assert.deepEqual(publicationErrors({ ...valid, stock: 0 }), [])
})

test('public catalog excludes base and custom drafts; admin can load both', async () => {
  const db = {
    collection: (name) => ({ find: () => ({ toArray: async () => name === 'product_overrides'
      ? [
        { slug: 'base-draft', data: { published: false } },
        { slug: 'base-deleted', deleted: true, data: {} },
        { slug: 'base-alias', publicSlug: 'alias-public', data: {} },
      ]
      : [{ ...valid, slug: 'custom-draft', published: false }, { ...valid, slug: 'custom-live' }] }) }),
  }
  const { loadProducts, findAnyProduct } = await moduleWithMocks('../lib/api/shared.js', {
    'next/server': { NextResponse },
    '@/lib/db': { getDb: async () => db },
    '@/lib/data/products': { PRODUCTS: ['base-live', 'base-draft', 'base-deleted', 'base-alias'].map((slug) => ({ ...valid, slug })) },
    '@/lib/product-publication': { isPublishedProduct },
    '@/lib/catalog': { ensureCleanSlugs: async () => {}, normalizeCategory: (v) => v },
  })
  assert.deepEqual(Array.from(await loadProducts(), (p) => p.slug), ['base-live', 'alias-public', 'custom-live'])
  assert.equal((await loadProducts({ includeDrafts: true })).length, 5)
  assert.equal(await findAnyProduct('custom-draft'), undefined)
  assert.equal((await findAnyProduct('alias-public'))._baseSlug, 'base-alias')
})

async function productHandler(initial = []) {
  let products = initial.map((p) => ({ ...p }))
  const writes = []
  const notices = []
  const db = {
    collection: (name) => ({
      findOne: async ({ slug }) => name === 'products_custom' ? products.find((p) => p.slug === slug && p._custom) || null : null,
      insertOne: async (product) => { products.push({ ...product, _custom: true }); writes.push(product) },
      updateOne: async ({ slug }, update) => {
        const index = products.findIndex((p) => p.slug === slug)
        const patch = name === 'products_custom' ? update.$set : update.$set.data
        if (index >= 0) products[index] = { ...products[index], ...patch }
        writes.push(update)
      },
    }),
  }
  const { handle } = await moduleWithMocks('../lib/api/handlers/admin/products.js', {
    uuid: { v4: () => 'test-id' },
    '../../shared': { NextResponse, loadProducts: async ({ includeDrafts = false } = {}) => products.filter((p) => includeDrafts || isPublishedProduct(p)) },
    '@/lib/db': { getDb: async () => db },
    '@/lib/stock-alerts': { notifyBackInStock: async (_, p) => { notices.push(p); return { sent: 0 } } },
    '@/lib/catalog': {
      normalizeCategory: (v) => v, uniqueSlug: async () => 'creation',
      isAutoSlug: () => false, renameCustomSlug: async (_, slug) => slug,
      productSlug: (v) => v, resolveStorageSlug: async (_, slug) => slug,
      checkSlugAvailable: async (_, slug) => ({ ok: true, slug }),
      changeProductSlug: async (_, __, slug) => slug,
    },
    '@/lib/stock': { stockMismatch: () => null },
    '@/lib/product-publication': { isPublishedProduct, publicationErrors },
  })
  return {
    request: (method, body, slug = 'coussin') => handle({
      method, url: new URL(`https://example.test/api/admin/products?slug=${slug}`),
      request: { json: async () => body },
    }),
    writes, notices,
  }
}

test('creation always starts as a draft, even if a caller requests publication', async () => {
  const { request, writes } = await productHandler()
  assert.equal((await request('POST', { ...valid, published: true })).status, 200)
  assert.equal(writes[0].published, false)
})

test('incomplete drafts can be saved but cannot be published', async () => {
  const { request, writes, notices } = await productHandler([{ ...valid, _custom: true, published: false }])
  assert.equal((await request('PATCH', { price: 0, published: false })).status, 200)
  const result = await request('PATCH', { published: true })
  assert.equal(result.status, 400)
  assert.match(result.body.error, /prix/)
  assert.equal(writes.length, 1)
  assert.equal(notices.length, 0)
})

test('valid draft publication notifies stock watchers and is visible to admin', async () => {
  const { request, notices } = await productHandler([{ ...valid, _custom: true, published: false }])
  assert.equal((await request('GET')).body.products.length, 1)
  assert.equal((await request('PATCH', { published: true })).status, 200)
  assert.equal(notices.length, 1)
})

test('base products can be unpublished without losing their stored data', async () => {
  const { request, writes, notices } = await productHandler([valid])
  assert.equal((await request('PATCH', { ...valid, published: false })).status, 200)
  assert.equal(writes[0].$set.data.published, false)
  assert.equal(notices.length, 0)
})

test('missing products and invalid publication status cannot be written', async () => {
  const missing = await productHandler()
  assert.equal((await missing.request('PATCH', { published: true })).status, 404)
  assert.equal(missing.writes.length, 0)
  const existing = await productHandler([valid])
  assert.equal((await existing.request('PATCH', { published: 'yes' })).status, 400)
  assert.equal(existing.writes.length, 0)
})

test('failed HTTP and network requests never report success', async () => {
  const originalFetch = globalThis.fetch
  try {
    globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: 'Prix invalide' }) })
    await assert.rejects(adminRequest('/test'), /Prix invalide/)
    globalThis.fetch = async () => { throw new Error('Connexion perdue') }
    await assert.rejects(adminRequest('/test'), /Connexion perdue/)
    globalThis.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError('Invalid JSON') } })
    await assert.rejects(adminRequest('/test'), /Invalid JSON/)
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ ok: true }) })
    assert.deepEqual(await adminRequest('/test'), { ok: true })
  } finally { globalThis.fetch = originalFetch }
})
