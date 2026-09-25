import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { saveMedia, mimeFor } from '@/lib/media-storage'
import { extractDominantColor, rgbToHex, findClosestVariant } from '@/lib/color-analysis'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'
import { v4 as uuid } from 'uuid'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/auto-assign-variant
 *
 * Deux modes :
 *
 * A) Analyse uniquement (dry-run, JSON body)
 *    Body: { slug, imageUrls: ["/api/img/...", ...] }
 *    Retour: { assignments: [{ imageUrl, variantIndex, variantName, distance, dominant }], variants: [...] }
 *
 * B) Bulk upload + auto-assign (multipart form-data)
 *    Body multipart:
 *      slug (string)
 *      files[] (multiple files)
 *      apply (bool = 'true' pour appliquer directement dans le produit)
 *    Retour: { uploads: [{ filename, url, variantIndex, variantName, distance }], applied: bool }
 */
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const contentType = request.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')

  try {
    if (isMultipart) {
      return await handleBulkUpload(request)
    }
    return await handleAnalyzeOnly(request)
  } catch (e) {
    console.error('auto-assign error', e)
    return NextResponse.json({ error: e.message || 'Échec' }, { status: 500 })
  }
}

/* ============ Mode analyse uniquement (JSON) ============ */
async function handleAnalyzeOnly(request) {
  const { slug, imageUrls } = (await request.json()) || {}
  if (!slug) return NextResponse.json({ error: 'slug manquant' }, { status: 400 })
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    return NextResponse.json({ error: 'imageUrls[] obligatoire' }, { status: 400 })
  }
  const product = await getProduct(slug)
  if (!product) return NextResponse.json({ error: 'Produit inconnu' }, { status: 404 })
  const variants = product.variants || []
  if (variants.length === 0) return NextResponse.json({ error: 'Aucune variante définie sur ce produit' }, { status: 400 })

  const { loadMedia } = await import('@/lib/media-storage')
  const assignments = []
  for (const url of imageUrls) {
    const filename = String(url).replace(/^\/api\/(img|file)\//, '')
    const media = await loadMedia(filename)
    if (!media) { assignments.push({ imageUrl: url, error: 'introuvable' }); continue }
    const dom = await extractDominantColor(media.buffer)
    const closest = findClosestVariant(dom, variants)
    assignments.push({
      imageUrl: url,
      variantIndex: closest?.index ?? null,
      variantName: closest?.variant?.name ?? null,
      variantHex: closest?.variant?.hex ?? null,
      distance: Number((closest?.distance ?? Infinity).toFixed(2)),
      confidence: dom.confident ? 'high' : 'low',
      dominant: { ...dom, hex: rgbToHex(dom) },
    })
  }
  return NextResponse.json({ assignments, variants: variants.map((v) => ({ name: v.name, hex: v.hex })) })
}

/* ============ Mode bulk upload (multipart) ============ */
async function handleBulkUpload(request) {
  const form = await request.formData()
  const slug = String(form.get('slug') || '').trim()
  const apply = String(form.get('apply') || 'true') === 'true'
  const files = form.getAll('files').filter((f) => typeof f !== 'string')
  if (!slug) return NextResponse.json({ error: 'slug manquant' }, { status: 400 })
  if (files.length === 0) return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })

  const product = await getProduct(slug)
  if (!product) return NextResponse.json({ error: 'Produit inconnu' }, { status: 404 })
  const variants = [...(product.variants || [])]
  if (variants.length === 0) return NextResponse.json({ error: 'Ce produit n\'a pas de variantes' }, { status: 400 })

  const uploads = []
  const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']

  for (const file of files) {
    const arrayBuf = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuf)
    const original = file.name || 'photo.jpg'
    let rawExt = (original.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!IMAGE_EXTS.includes(rawExt)) {
      uploads.push({ originalName: original, error: `Extension .${rawExt} non supportée` })
      continue
    }
    // Compression si > 2 Mo
    if (buffer.length > 2 * 1024 * 1024 && rawExt !== 'webp') {
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
    // Sauvegarde MongoDB
    const filename = 'upload-' + uuid().slice(0, 8) + '.' + rawExt
    await saveMedia({ filename, buffer, contentType: mimeFor(rawExt), originalName: original })
    const publicUrl = `/api/img/${filename.replace(/\.(jpe?g|webp|png)$/i, '')}`

    // Détection couleur + variante la plus proche
    const dom = await extractDominantColor(buffer)
    const closest = findClosestVariant(dom, variants)
    uploads.push({
      originalName: original,
      filename,
      url: publicUrl,
      variantIndex: closest?.index ?? null,
      variantName: closest?.variant?.name ?? null,
      variantHex: closest?.variant?.hex ?? null,
      distance: Number((closest?.distance ?? Infinity).toFixed(2)),
      confidence: dom.confident ? 'high' : 'low',
      dominant: rgbToHex(dom),
    })
  }

  // Applique dans le produit si demandé
  let applied = false
  if (apply) {
    for (const u of uploads) {
      if (u.error || u.variantIndex == null) continue
      variants[u.variantIndex] = { ...variants[u.variantIndex], image: u.url }
    }
    const db = await getDb()
    const customDoc = await db.collection('products_custom').findOne({ slug })
    if (customDoc) {
      await db.collection('products_custom').updateOne(
        { slug },
        { $set: { 'data.variants': variants, updatedAt: new Date() } },
      )
    } else {
      const overrideDoc = await db.collection('product_overrides').findOne({ slug })
      const overrideData = overrideDoc?.data || {}
      overrideData.variants = variants
      await db.collection('product_overrides').updateOne(
        { slug },
        { $set: { slug, data: overrideData, updatedAt: new Date() } },
        { upsert: true },
      )
    }
    applied = true
  }

  return NextResponse.json({ uploads, applied, variants: variants.map((v) => ({ name: v.name, hex: v.hex, image: v.image })) })
}

/* ============ HELPERS ============ */
async function getProduct(slug) {
  const db = await getDb()
  const [override, custom] = await Promise.all([
    db.collection('product_overrides').findOne({ slug }),
    db.collection('products_custom').findOne({ slug }),
  ])
  if (custom) return custom.data
  const base = BASE_PRODUCTS.find((p) => p.slug === slug)
  if (!base) return null
  return override?.data ? { ...base, ...override.data } : base
}
