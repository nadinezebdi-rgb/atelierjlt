import { v4 as uuid } from 'uuid'
import { NextResponse } from '../../shared'

// Upload image/vidéo/PDF — multipart form-data — compression auto (Jimp) + persistance Mongo
export async function handle({ request, method }) {
  if (method !== 'POST') return null
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }
    const fs = await import('node:fs')
    const path = await import('node:path')
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    const originalSize = buffer.length
    const original = file.name || 'upload.bin'
    let rawExt = (original.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']
    const VIDEO_EXTS = ['mp4', 'webm', 'mov']
    const DOC_EXTS = ['pdf']
    const ALL_EXTS = [...IMAGE_EXTS, ...VIDEO_EXTS, ...DOC_EXTS]
    if (!ALL_EXTS.includes(rawExt)) {
      return NextResponse.json({
        error: `Extension non supportée : .${rawExt}. Autorisés : ${ALL_EXTS.join(', ')}`
      }, { status: 400 })
    }
    const maxBytes = IMAGE_EXTS.includes(rawExt) ? 25 * 1024 * 1024 : 50 * 1024 * 1024
    if (buffer.length > maxBytes) {
      return NextResponse.json({
        error: `Fichier trop volumineux (${(buffer.length / 1024 / 1024).toFixed(1)} Mo, max ${maxBytes / 1024 / 1024} Mo)`
      }, { status: 400 })
    }

    // Compression auto — images > 2 Mo (jimp, pure JS)
    let compressed = false
    let compressedSize = null
    if (IMAGE_EXTS.includes(rawExt) && buffer.length > 2 * 1024 * 1024 && rawExt !== 'webp') {
      try {
        const { Jimp } = await import('jimp')
        const img = await Jimp.read(buffer)
        const w = img.bitmap.width
        const h = img.bitmap.height
        const maxSide = 2400
        if (w > maxSide || h > maxSide) {
          if (w >= h) img.resize({ w: maxSide })
          else img.resize({ h: maxSide })
        }
        const outBuf = await img.getBuffer('image/jpeg', { quality: 82 })
        if (outBuf.length < buffer.length) {
          buffer = outBuf
          rawExt = 'jpg'
          compressed = true
          compressedSize = outBuf.length
        }
      } catch (e) {
        console.warn('compression skipped', e?.message || e)
      }
    }

    const name = 'upload-' + uuid().slice(0, 8) + '.' + rawExt
    // Persistance : Mongo (résistant au redeploy) + disque (cache session)
    try {
      const { saveMedia, mimeFor } = await import('@/lib/media-storage')
      await saveMedia({
        filename: name,
        buffer,
        contentType: mimeFor(rawExt),
        originalName: original,
      })
    } catch (mongoErr) {
      console.error('mongo save failed, continuing to disk', mongoErr)
    }
    const dir = path.join(process.cwd(), 'lib', 'product-images')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    try { fs.writeFileSync(path.join(dir, name), buffer) } catch (diskErr) {
      console.warn('disk write skipped', diskErr?.message)
    }
    let kind, publicUrl
    if (IMAGE_EXTS.includes(rawExt)) {
      kind = 'image'
      publicUrl = '/api/img/' + name.replace(/\.(jpe?g|webp|png)$/i, '')
    } else if (VIDEO_EXTS.includes(rawExt)) {
      kind = 'video'
      publicUrl = '/api/file/' + name
    } else {
      kind = 'pdf'
      publicUrl = '/api/file/' + name
    }
    return NextResponse.json({
      ok: true,
      url: publicUrl,
      filename: name,
      kind,
      size: buffer.length,
      originalName: original,
      originalSize,
      compressed,
      compressedSize,
    })
  } catch (e) {
    console.error('upload error', e)
    return NextResponse.json({ error: 'Upload failed', details: String(e?.message || e) }, { status: 500 })
  }
}
