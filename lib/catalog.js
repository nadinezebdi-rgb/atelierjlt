// Catalogue — helpers partagés : adresses web (slugs), catégories, écriture
// d'un produit (base + override ou produit créé dans l'admin), stock des commandes.
import { getDb } from '@/lib/db'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'
import { availableUnits } from '@/lib/stock'

/** « Grand panier de rangement » → « grand-panier-de-rangement » */
export function slugify(str) {
  return String(str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
    .replace(/-+$/g, '')
}

// Anciennes collections, fusionnées dans « Les Intemporels » : plus aucun lien ne doit y mener.
export const LEGACY_COLLECTIONS = ['racine', 'empreinte']

/** Adresse d'un produit : tirée du nom, sans les anciens noms de collection. */
export function productSlug(name) {
  const words = slugify(name).split('-').filter((w) => w && !LEGACY_COLLECTIONS.includes(w))
  return words.join('-') || 'creation'
}

/** « DECORATION », « Décoration » → « decoration » ; « racine » / « empreinte » → « intemporels » */
export function normalizeCategory(c) {
  if (!c || typeof c !== 'string') return c
  const s = slugify(c) || c
  return LEGACY_COLLECTIONS.includes(s) ? 'intemporels' : s
}

/** Lien interne : remplace les anciennes collections par « Les Intemporels ». */
export function cleanCollectionHref(href) {
  if (typeof href !== 'string') return href
  return href.replace(/([?&](?:cat|collection)=)(racine|empreinte)\b/gi, '$1intemporels')
}

/** Adresse générée automatiquement (ancienne création admin) → à remplacer */
export function isAutoSlug(slug) {
  return /^produit-[a-z0-9]{5,}$/i.test(slug || '') || /^nouvelle-creation(-\d+)?$/.test(slug || '')
    || (slug || '').split('-').some((w) => LEGACY_COLLECTIONS.includes(w))
}

/** Slug libre, dérivé du nom, qui ne collisionne avec aucun produit ni ancienne adresse. */
export async function uniqueSlug(db, name, exceptSlug = null) {
  const base = productSlug(name)
  const taken = new Set(BASE_PRODUCTS.flatMap((p) => [p.slug, ...(p.previousSlugs || [])]))
  const customs = await db.collection('products_custom').find({}, { projection: { slug: 1, previousSlugs: 1 } }).toArray()
  for (const c of customs) {
    if (c.slug !== exceptSlug) taken.add(c.slug)
    for (const s of c.previousSlugs || []) if (s !== exceptSlug) taken.add(s)
  }
  if (!taken.has(base)) return base
  for (let i = 2; i < 500; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
  return `${base}-${Date.now().toString(36)}`
}

/** Change l'adresse d'un produit créé dans l'admin ; l'ancienne reste redirigée. */
export async function renameCustomSlug(db, oldSlug, newSlug) {
  if (!newSlug || newSlug === oldSlug) return oldSlug
  await db.collection('products_custom').updateOne(
    { slug: oldSlug },
    { $set: { slug: newSlug, updatedAt: new Date() }, $addToSet: { previousSlugs: oldSlug } }
  )
  await renameRefs(db, oldSlug, newSlug)
  return newSlug
}

async function renameRefs(db, oldSlug, newSlug) {
  // Paniers, listes d'envies et alertes de stock suivent la nouvelle adresse
  await db.collection('carts').updateMany({ 'items.slug': oldSlug }, { $set: { 'items.$[i].slug': newSlug } }, { arrayFilters: [{ 'i.slug': oldSlug }] }).catch(() => {})
  await db.collection('saved_carts').updateMany({ 'items.slug': oldSlug }, { $set: { 'items.$[i].slug': newSlug } }, { arrayFilters: [{ 'i.slug': oldSlug }] }).catch(() => {})
  await db.collection('wishlists').updateMany({ slugs: oldSlug }, { $set: { 'slugs.$': newSlug } }).catch(() => {})
  await db.collection('stock_alerts').updateMany({ slug: oldSlug }, { $set: { slug: newSlug } }).catch(() => {})
}

/** Une seule fois par démarrage : remplace les adresses « produit-123… » par une adresse tirée du nom. */
let slugsChecked = false
export async function ensureCleanSlugs() {
  if (slugsChecked) return
  slugsChecked = true
  try {
    const db = await getDb()
    // Produits du catalogue de base dont l'adresse a changé : les réglages suivent
    for (const p of BASE_PRODUCTS) {
      for (const old of p.previousSlugs || []) {
        const prev = await db.collection('product_overrides').findOne({ slug: old })
        if (!prev) continue
        const cur = await db.collection('product_overrides').findOne({ slug: p.slug })
        if (cur) continue
        await db.collection('product_overrides').updateOne({ _id: prev._id }, { $set: { slug: p.slug, migratedFrom: old } })
        await renameRefs(db, old, p.slug)
        console.log(`[catalog] adresse corrigée : ${old} → ${p.slug}`)
      }
    }
    const customs = await db.collection('products_custom').find({}, { projection: { slug: 1, name: 1 } }).toArray()
    for (const c of customs) {
      if (!isAutoSlug(c.slug) || !c.name || slugify(c.name) === 'nouvelle-creation') continue
      if (productSlug(c.name) === c.slug) continue
      const next = await uniqueSlug(db, c.name, c.slug)
      await renameCustomSlug(db, c.slug, next)
      console.log(`[catalog] adresse corrigée : ${c.slug} → ${next}`)
    }
  } catch (e) {
    slugsChecked = false
    console.error('[catalog] ensureCleanSlugs', e?.message)
  }
}

/** Ancienne adresse → adresse actuelle (pour la redirection des fiches). */
export async function resolvePreviousSlug(slug) {
  const base = BASE_PRODUCTS.find((p) => (p.previousSlugs || []).includes(slug))
  if (base) return base.slug
  const db = await getDb()
  const c = await db.collection('products_custom').findOne({ previousSlugs: slug }, { projection: { slug: 1 } })
  return c?.slug || null
}

/** Écrit quelques champs d'un produit, qu'il vienne du catalogue de base ou de l'admin. */
export async function saveProductFields(db, slug, fields) {
  const custom = await db.collection('products_custom').findOne({ slug }, { projection: { _id: 1 } })
  if (custom) {
    await db.collection('products_custom').updateOne({ slug }, { $set: { ...fields, updatedAt: new Date() } })
    return
  }
  const existing = await db.collection('product_overrides').findOne({ slug })
  await db.collection('product_overrides').updateOne(
    { slug },
    { $set: { slug, data: { ...(existing?.data || {}), ...fields }, updatedAt: new Date() } },
    { upsert: true }
  )
}

/**
 * Vérifie puis retire du stock les pièces d'une commande.
 * Retourne { ok: true } ou { ok: false, problems: [{ name, variant, size, wanted, available }] }.
 */
export async function reserveStock(db, items, products) {
  const bySlug = new Map(products.map((p) => [p.slug, structuredClone(p)]))
  // Quantités demandées par ligne (même pièce / couleur / taille regroupées)
  const problems = []
  const wantedBy = new Map()
  for (const it of items) {
    const k = `${it.slug}|${it.variant || ''}|${it.size || ''}`
    wantedBy.set(k, (wantedBy.get(k) || 0) + Number(it.qty || 1))
  }
  const wantedByProduct = new Map()
  for (const it of items) wantedByProduct.set(it.slug, (wantedByProduct.get(it.slug) || 0) + Number(it.qty || 1))

  for (const [k, wanted] of wantedBy) {
    const [slug, variant, size] = k.split('|')
    const p = bySlug.get(slug)
    if (!p) { problems.push({ name: slug, wanted, available: 0 }); continue }
    const avail = availableUnits(p, variant || null, size || null)
    if (wanted > avail) problems.push({ name: p.name, variant: variant || null, size: size || null, wanted, available: avail })
  }
  for (const [slug, wanted] of wantedByProduct) {
    const p = bySlug.get(slug)
    if (p && typeof p.stock === 'number' && wanted > p.stock && !problems.some((x) => x.name === p.name)) {
      problems.push({ name: p.name, wanted, available: Math.max(0, p.stock) })
    }
  }
  if (problems.length) return { ok: false, problems }

  // Décrément
  for (const [slug, wanted] of wantedByProduct) {
    const p = bySlug.get(slug)
    if (!p) continue
    const fields = {}
    if (typeof p.stock === 'number') fields.stock = Math.max(0, p.stock - wanted)
    const lines = items.filter((i) => i.slug === slug)
    if (Array.isArray(p.variants) && p.variants.length && lines.some((l) => l.variant)) {
      fields.variants = p.variants.map((v) => {
        const q = lines.filter((l) => l.variant === v.name).reduce((s, l) => s + Number(l.qty || 1), 0)
        return q ? { ...v, stock: Math.max(0, Number(v.stock || 0) - q) } : v
      })
    }
    if (Array.isArray(p.sizes) && p.sizes.length && lines.some((l) => l.size)) {
      fields.sizes = p.sizes.map((s) => {
        const q = lines.filter((l) => l.size === s.label).reduce((sum, l) => sum + Number(l.qty || 1), 0)
        return q ? { ...s, stock: Math.max(0, Number(s.stock || 0) - q) } : s
      })
    }
    if (Object.keys(fields).length) await saveProductFields(db, slug, fields)
  }
  return { ok: true }
}
