import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { loadMedia, saveMedia, mimeFor } from '@/lib/media-storage'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/broken-media
 *   → { products: [{slug, name, images: [{url, slot, brokenAt, kind}]}], summary }
 *
 *   Scanne tous les produits (base + overrides + custom) et détecte les
 *   URLs `/api/img/...` ou `/api/file/...` qui retournent introuvable.
 *
 * POST /api/admin/broken-media/replace
 *   Body multipart : file + slug + slot ('images:N' | 'variant:hex' | 'gallery:N')
 *   → Upload le fichier ET remplace directement dans le produit.
 */
export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const db = await getDb()
  const [overrides, custom] = await Promise.all([
    db.collection('product_overrides').find({}).toArray(),
    db.collection('products_custom').find({}).toArray(),
  ])
  const overrideMap = new Map(overrides.map((o) => [o.slug, o.data]))
  const merged = BASE_PRODUCTS.map((p) => {
    const o = overrideMap.get(p.slug)
    return o ? { ...p, ...o } : p
  })
  const customs = custom.map((c) => ({ ...c.data, slug: c.slug }))
  const all = [...merged, ...customs]

  // Extrait toutes les URLs médias
  const products = []
  for (const p of all) {
    const slots = []
    const images = Array.isArray(p.images) ? p.images : []
    for (let i = 0; i < images.length; i++) {
      slots.push({ url: images[i], slot: `images:${i}`, kind: 'image' })
    }
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        if (v.image) slots.push({ url: v.image, slot: `variant:${v.hex || v.name}`, kind: 'image', label: v.name || v.hex })
      }
    }
    if (Array.isArray(p.sizes)) {
      for (const s of p.sizes) {
        if (s.image) slots.push({ url: s.image, slot: `size:${s.name || s.label}`, kind: 'image', label: s.name || s.label })
      }
    }
    // Test chaque URL
    const brokenSlots = []
    for (const s of slots) {
      const url = s.url || ''
      if (!url.startsWith('/api/img/') && !url.startsWith('/api/file/')) continue  // ignorer externes
      const filename = url.replace(/^\/api\/(img|file)\//, '')
      const media = await loadMedia(filename)
      if (!media) brokenSlots.push({ ...s, filename })
    }
    if (brokenSlots.length > 0) {
      products.push({
        slug: p.slug,
        name: p.name,
        broken: brokenSlots,
        totalSlots: slots.length,
      })
    }
  }

  return NextResponse.json({
    products,
    summary: {
      productsWithMissing: products.length,
      totalMissing: products.reduce((a, p) => a + p.broken.length, 0),
    },
  })
}

/**
 * POST /api/admin/broken-media/replace
 * Body multipart form-data :
 *   file    — le nouveau fichier
 *   slug    — slug produit
 *   slot    — 'images:N' | 'variant:HEX' | 'size:NAME' | 'gallery:N'
 * Retour : { ok, url }
 */
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const form = await request.formData()
    const file = form.get('file')
    const slug = String(form.get('slug') || '').trim()
    const slot = String(form.get('slot') || '').trim()
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })
    if (!slug || !slot) return NextResponse.json({ error: 'slug et slot obligatoires' }, { status: 400 })

    // Lecture + compression via jimp si > 2 Mo
    const arrayBuf = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuf)
    const original = file.name || 'upload.bin'
    let rawExt = (original.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']
    if (!IMAGE_EXTS.includes(rawExt) && !['mp4', 'webm', 'pdf'].includes(rawExt)) {
      return NextResponse.json({ error: `Extension ${rawExt} non supportée` }, { status: 400 })
    }
    if (IMAGE_EXTS.includes(rawExt) && buffer.length > 2 * 1024 * 1024 && rawExt !== 'webp') {
      try {
        const { Jimp } = await import('jimp')
        const img = await Jimp.read(buffer)
        const maxSide = 2400
        if (img.bitmap.width > maxSide || img.bitmap.height > maxSide) {
          if (img.bitmap.width >= img.bitmap.height) img.resize({ w: maxSide })
          else img.resize({ h: maxSide })
        }
        const outBuf = await img.getBuffer('image/jpeg', { quality: 82 })
        if (outBuf.length < buffer.length) { buffer = outBuf; rawExt = 'jpg' }
      } catch (e) { console.warn('compress skipped', e?.message) }
    }

    // Génère un nom stable (préfixe upload-)
    const { v4: uuid } = await import('uuid')
    const filename = 'upload-' + uuid().slice(0, 8) + '.' + rawExt
    await saveMedia({
      filename,
      buffer,
      contentType: mimeFor(rawExt),
      originalName: original,
    })
    // Écrit aussi sur disque pour cache local
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dir = path.join(process.cwd(), 'lib', 'product-images')
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(path.join(dir, filename), buffer)
    } catch {}

    const newUrl = (rawExt === 'mp4' || rawExt === 'webm' || rawExt === 'pdf')
      ? `/api/file/${filename}`
      : `/api/img/${filename.replace(/\.(jpe?g|webp|png)$/i, '')}`

    // Applique dans le produit : mise à jour de product_overrides.
    const db = await getDb()
    const baseProduct = BASE_PRODUCTS.find((p) => p.slug === slug)
    const customDoc = await db.collection('products_custom').findOne({ slug })
    const overrideDoc = await db.collection('product_overrides').findOne({ slug })

    if (!baseProduct && !customDoc) return NextResponse.json({ error: 'Produit inconnu' }, { status: 404 })

    const collection = customDoc ? 'products_custom' : 'product_overrides'
    const key = customDoc ? 'data' : 'data'
    const currentBase = customDoc ? customDoc.data : (baseProduct || {})
    const overrideData = overrideDoc?.data || {}
    // On travaille sur une copie "vue actuelle" (merge base + override)
    const current = customDoc ? currentBase : { ...currentBase, ...overrideData }
    const next = structuredClone(current)

    const [type, arg] = slot.split(':')
    if (type === 'images') {
      const idx = Number(arg)
      const imgs = Array.isArray(next.images) ? [...next.images] : []
      if (imgs.length <= idx) while (imgs.length <= idx) imgs.push('')
      imgs[idx] = newUrl
      next.images = imgs
    } else if (type === 'variant') {
      const variants = Array.isArray(next.variants) ? [...next.variants] : []
      const vidx = variants.findIndex((v) => (v.hex || v.name) === arg)
      if (vidx >= 0) { variants[vidx] = { ...variants[vidx], image: newUrl }; next.variants = variants }
    } else if (type === 'size') {
      const sizes = Array.isArray(next.sizes) ? [...next.sizes] : []
      const sidx = sizes.findIndex((s) => (s.name || s.label) === arg)
      if (sidx >= 0) { sizes[sidx] = { ...sizes[sidx], image: newUrl }; next.sizes = sizes }
    } else {
      return NextResponse.json({ error: `Slot inconnu : ${type}` }, { status: 400 })
    }

    // Sauvegarde
    if (customDoc) {
      await db.collection('products_custom').updateOne({ slug }, { $set: { data: next, updatedAt: new Date() } })
    } else {
      // Store as override — merge with existing override data
      const mergedOverride = { ...overrideData }
      if (type === 'images') mergedOverride.images = next.images
      if (type === 'variant') mergedOverride.variants = next.variants
      if (type === 'size') mergedOverride.sizes = next.sizes
      await db.collection('product_overrides').updateOne(
        { slug },
        { $set: { slug, data: mergedOverride, updatedAt: new Date() } },
        { upsert: true },
      )
    }

    return NextResponse.json({ ok: true, url: newUrl, slug, slot })
  } catch (e) {
    console.error('replace error', e)
    return NextResponse.json({ error: e.message || 'Échec' }, { status: 500 })
  }
}
