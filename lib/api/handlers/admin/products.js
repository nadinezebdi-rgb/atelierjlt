import { v4 as uuid } from 'uuid'
import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'
import { notifyBackInStock } from '@/lib/stock-alerts'
import { normalizeCategory, uniqueSlug, isAutoSlug, renameCustomSlug, productSlug } from '@/lib/catalog'

export async function handle({ request, method, url }) {
  const db = await getDb()

  if (method === 'GET') {
    const all = await loadProducts()
    return NextResponse.json({ products: all })
  }
  if (method === 'POST' && url.pathname.endsWith('/bulk')) {
    // Modification groupée : { slugs: [...], set: { isNew?: bool, isLimited?: bool } }
    const body = await request.json().catch(() => ({}))
    const slugs = Array.isArray(body.slugs) ? body.slugs.slice(0, 500).map(String) : []
    const set = {}
    for (const k of ['isNew', 'isLimited']) if (typeof body.set?.[k] === 'boolean') set[k] = body.set[k]
    if (!slugs.length || !Object.keys(set).length) return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })
    const all = await loadProducts()
    let updated = 0
    for (const slug of slugs) {
      const p = all.find((x) => x.slug === slug)
      if (!p) continue
      if (p._custom) {
        await db.collection('products_custom').updateOne({ slug }, { $set: set })
      } else {
        const existing = await db.collection('product_overrides').findOne({ slug })
        const data = { ...(existing?.data || {}), ...set }
        await db.collection('product_overrides').updateOne(
          { slug },
          { $set: { slug, data, deleted: existing?.deleted || false, updatedAt: new Date() } },
          { upsert: true }
        )
      }
      updated++
    }
    return NextResponse.json({ ok: true, updated })
  }
  if (method === 'POST') {
    const body = await request.json()
    // Adresse web claire, tirée du nom (jamais « produit-123… »)
    const slug = await uniqueSlug(db, body.name || 'Nouvelle création')
    const now = new Date()
    await db.collection('products_custom').insertOne({
      _id: uuid(), slug,
      name: body.name || 'Nouvelle création',
      category: normalizeCategory(body.category) || 'intemporels',
      collection: normalizeCategory(body.collection) || 'intemporels',
      price: Number(body.price) || 0,
      material: body.material || '',
      color: body.color || '',
      style: body.style || '',
      dimensions: body.dimensions || '',
      weight: body.weight || '',
      makingTime: body.makingTime || '',
      stock: Number(body.stock) || 0,
      isNew: Boolean(body.isNew),
      isLimited: Boolean(body.isLimited),
      tags: body.tags || [],
      images: body.images || [],
      story: body.story || '',
      care: body.care || '',
      createdAt: now,
    })
    return NextResponse.json({ ok: true, slug })
  }
  if (method === 'PATCH') {
    let slug = url.searchParams.get('slug')
    const raw = await request.json()
    const { _id, _custom, slug: _s, previousSlugs: _p, ...body } = raw || {}
    if (body.category) body.category = normalizeCategory(body.category)
    if (body.collection) body.collection = normalizeCategory(body.collection)
    const cust = await db.collection('products_custom').findOne({ slug })
    if (cust) {
      await db.collection('products_custom').updateOne({ slug }, { $set: body })
      // Nom choisi pour une nouvelle création → adresse web tirée du nom
      if (body.name && isAutoSlug(slug) && productSlug(body.name) !== 'nouvelle-creation' && productSlug(body.name) !== slug) {
        slug = await renameCustomSlug(db, slug, await uniqueSlug(db, body.name, slug))
      }
    } else {
      await db.collection('product_overrides').updateOne(
        { slug },
        { $set: { slug, data: body, deleted: false, updatedAt: new Date() } },
        { upsert: true }
      )
    }
    // Retour en stock → prévient automatiquement les personnes inscrites
    let stockAlerts = null
    try {
      const after = (await loadProducts()).find((p) => p.slug === slug)
      stockAlerts = await notifyBackInStock(db, after)
    } catch (e) {
      console.error('[stock-alerts]', e?.message)
    }
    return NextResponse.json({ ok: true, slug, stockAlerts })
  }
  if (method === 'DELETE') {
    const slug = url.searchParams.get('slug')
    const cust = await db.collection('products_custom').findOne({ slug })
    if (cust) {
      await db.collection('products_custom').deleteOne({ slug })
    } else {
      await db.collection('product_overrides').updateOne(
        { slug }, { $set: { slug, deleted: true, updatedAt: new Date() } }, { upsert: true }
      )
    }
    return NextResponse.json({ ok: true })
  }
  return null
}
