import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'

// ---- Session cookie (cart, guest) ----
export const SID_COOKIE = 'ginette_sid'
export function getSid(request) {
  return request.cookies.get(SID_COOKIE)?.value || null
}
export function setSidCookie(res, sid) {
  res.cookies.set(SID_COOKIE, sid, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60,
  })
}

// ---- Merged product catalogue (base + admin overrides + admin-added) ----
// Categories to hide from the public catalogue (kept in source for potential
// future reactivation).
import { ensureCleanSlugs, normalizeCategory } from '@/lib/catalog'

export const HIDDEN_CATEGORIES = new Set(['terre'])

export async function loadProducts() {
  await ensureCleanSlugs()
  const db = await getDb()
  const overrides = await db.collection('product_overrides').find({}).toArray()
  const custom = await db.collection('products_custom').find({}).toArray()
  const overrideMap = new Map(overrides.map((o) => [o.slug, o]))
  const merged = BASE_PRODUCTS.map((p) => {
    const o = overrideMap.get(p.slug)
    if (!o) return p
    // publicSlug : adresse web choisie dans l'admin (la clé interne reste p.slug)
    return { ...p, ...o.data, slug: o.publicSlug || p.slug, _baseSlug: p.slug, id: p.id }
  })
  const deleted = new Set(overrides.filter((o) => o.deleted).map((o) => o.slug))
  const finalBase = merged.filter(
    (p) => !deleted.has(p._baseSlug || p.slug) && !HIDDEN_CATEGORIES.has(p.category)
  )
  const customFiltered = custom
    .map((c) => ({ ...c, _custom: true }))
    .filter((c) => !HIDDEN_CATEGORIES.has(c.category))
  // Catégories uniformes (« DECORATION » = « decoration ») ; racine / empreinte → intemporels
  return [...finalBase, ...customFiltered].map((p) => ({
    ...p,
    category: normalizeCategory(p.category),
    collection: normalizeCategory(p.collection),
  }))
}

export async function findAnyProduct(slug) {
  const all = await loadProducts()
  return all.find((p) => p.slug === slug)
}

// ---- Cart helpers ----
export function cartResponse(items = []) {
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }
}

export async function readCart(sid) {
  if (!sid) return []
  try {
    const db = await getDb()
    const doc = await db.collection('carts').findOne({ _id: sid })
    return doc?.items || []
  } catch (e) { return [] }
}

// userId (facultatif) : rattache le panier au compte connecté pour la relance
// « panier abandonné ». Toute modification remet le compteur de relances à zéro.
export async function writeCart(sid, items, userId = null) {
  const db = await getDb()
  const set = { items, updatedAt: new Date(), reminderCount: 0, lastReminderAt: null, reminderAttempts: 0 }
  if (userId) set.userId = userId
  await db.collection('carts').updateOne({ _id: sid }, { $set: set }, { upsert: true })
}

export function toCartLine(product, qty, variant, size) {
  const variantData = variant && product.variants
    ? product.variants.find((v) => v.name === variant)
    : null
  const sizeData = size && product.sizes
    ? product.sizes.find((s) => s.label === size)
    : null
  // Prix : la taille prime sur le variant qui prime sur le prix produit
  const price = sizeData?.price ?? variantData?.price ?? product.price
  return {
    slug: product.slug, name: product.name, price,
    category: product.category, image: variantData?.image || product.images[0], qty,
    variant: variant || null,
    variantHex: variantData?.hex || null,
    size: size || null,
    sizeDimensions: sizeData?.dimensions || null,
  }
}

export { NextResponse }
