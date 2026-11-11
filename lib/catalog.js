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
  for (const s of await takenSlugs(db, exceptSlug)) taken.add(s)
  if (!taken.has(base)) return base
  for (let i = 2; i < 500; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`
  return `${base}-${Date.now().toString(36)}`
}

/** Toutes les adresses déjà prises (actuelles + anciennes), sauf celles du produit `exceptSlug`. */
export async function takenSlugs(db, exceptSlug = null) {
  const out = new Set()
  const customs = await db.collection('products_custom').find({}, { projection: { slug: 1, previousSlugs: 1 } }).toArray()
  for (const c of customs) {
    if (c.slug === exceptSlug) continue
    out.add(c.slug)
    for (const s of c.previousSlugs || []) out.add(s)
  }
  const aliases = await db.collection('product_overrides').find({ publicSlug: { $exists: true } }, { projection: { slug: 1, publicSlug: 1, previousPublicSlugs: 1 } }).toArray()
  for (const o of aliases) {
    if (o.publicSlug === exceptSlug || o.slug === exceptSlug) continue
    out.add(o.publicSlug)
    for (const s of o.previousPublicSlugs || []) out.add(s)
  }
  return out
}

/**
 * Adresse publique → clé de stockage. Les produits du catalogue d'origine gardent
 * leur clé interne ; l'adresse choisie dans l'admin est un alias (publicSlug).
 */
export async function resolveStorageSlug(db, slug) {
  const o = await db.collection('product_overrides').findOne({ publicSlug: slug }, { projection: { slug: 1 } })
  return o?.slug || slug
}

/** Vérifie une adresse saisie dans l'admin. Retourne { ok, slug } ou { ok:false, error }. */
export async function checkSlugAvailable(db, wanted, currentSlug) {
  const slug = slugify(wanted)
  if (!slug || slug.length < 3) return { ok: false, error: 'Adresse trop courte (3 caractères minimum)' }
  if (slug.split('-').some((w) => LEGACY_COLLECTIONS.includes(w))) return { ok: false, error: '« racine » et « empreinte » ne sont plus utilisés dans les adresses' }
  if (slug === currentSlug) return { ok: true, slug, unchanged: true }
  const storage = await resolveStorageSlug(db, currentSlug)
  const taken = await takenSlugs(db, currentSlug)
  for (const p of BASE_PRODUCTS) {
    if (p.slug === storage) continue
    // Un produit d'origine renommé libère sa clé interne ? Non : on la garde réservée (redirections).
    taken.add(p.slug); for (const s of p.previousSlugs || []) taken.add(s)
  }
  const mine = BASE_PRODUCTS.find((p) => p.slug === storage)
  if (taken.has(slug) && !(mine && (mine.slug === slug || (mine.previousSlugs || []).includes(slug)))) {
    return { ok: false, error: 'Cette adresse est déjà utilisée par un autre produit' }
  }
  return { ok: true, slug }
}

/** Change l'adresse publique de n'importe quel produit ; l'ancienne redirige vers la nouvelle. */
export async function changeProductSlug(db, currentSlug, newSlug) {
  const custom = await db.collection('products_custom').findOne({ slug: currentSlug }, { projection: { _id: 1 } })
  if (custom) return renameCustomSlug(db, currentSlug, newSlug)
  const storage = await resolveStorageSlug(db, currentSlug)
  const base = BASE_PRODUCTS.find((p) => p.slug === storage)
  if (!base) return null
  const set = newSlug === base.slug ? { $unset: { publicSlug: '' } } : { $set: { publicSlug: newSlug } }
  await db.collection('product_overrides').updateOne(
    { slug: storage },
    { ...set, $addToSet: { previousPublicSlugs: currentSlug }, $setOnInsert: { data: {} } },
    { upsert: true }
  )
  await db.collection('product_overrides').updateOne({ slug: storage }, { $pull: { previousPublicSlugs: newSlug } })
  await renameRefs(db, currentSlug, newSlug)
  return newSlug
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
  const db = await getDb()
  const alias = await db.collection('product_overrides').findOne(
    { $or: [{ previousPublicSlugs: slug }, { slug, publicSlug: { $exists: true } }] },
    { projection: { slug: 1, publicSlug: 1 } }
  )
  if (alias) return alias.publicSlug || alias.slug
  const base = BASE_PRODUCTS.find((p) => (p.previousSlugs || []).includes(slug))
  if (base) {
    const o = await db.collection('product_overrides').findOne({ slug: base.slug }, { projection: { publicSlug: 1 } })
    return o?.publicSlug || base.slug
  }
  const c = await db.collection('products_custom').findOne({ previousSlugs: slug }, { projection: { slug: 1 } })
  return c?.slug || null
}

/** Écrit quelques champs d'un produit, qu'il vienne du catalogue de base ou de l'admin. */
export async function saveProductFields(db, publicSlug, fields) {
  const slug = await resolveStorageSlug(db, publicSlug)
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
  const low = []
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
    // Ce qui vient de passer à 1 pièce (ou moins) à cause de cette commande
    for (const v of fields.variants || []) {
      const before = Number(p.variants.find((x) => x.name === v.name)?.stock || 0)
      if (Number(v.stock) <= 1 && Number(v.stock) < before) low.push({ slug, product: p.name, kind: 'Couleur', label: v.name, stock: Number(v.stock) })
    }
    for (const z of fields.sizes || []) {
      const before = Number(p.sizes.find((x) => x.label === z.label)?.stock || 0)
      if (Number(z.stock) <= 1 && Number(z.stock) < before) low.push({ slug, product: p.name, kind: 'Taille', label: z.label, stock: Number(z.stock) })
    }
    if (!fields.variants && !fields.sizes && typeof fields.stock === 'number' && fields.stock <= 1 && fields.stock < p.stock) {
      low.push({ slug, product: p.name, kind: 'Produit', label: '', stock: fields.stock })
    }
  }
  return { ok: true, low }
}
