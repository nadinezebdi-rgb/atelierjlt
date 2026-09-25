import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { loadMedia } from '@/lib/media-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/check-variant-color
 * Body: { imageUrl, targetHex }
 * Retour: { ok, match: bool, dominant: { r,g,b, hex }, distance, message }
 *
 * Utilise jimp (sans dépendance externe) pour extraire la couleur dominante de
 * l'image et la comparer au hex de la variante. Comparaison en espace Lab.
 */
export async function POST(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  try {
    const body = await request.json()
    const { imageUrl, targetHex } = body || {}
    if (!imageUrl || !targetHex) return NextResponse.json({ error: 'imageUrl et targetHex obligatoires' }, { status: 400 })

    // Récupère le buffer via loadMedia (disque OU Mongo)
    const filename = String(imageUrl).replace(/^\/api\/(img|file)\//, '')
    const media = await loadMedia(filename)
    if (!media) return NextResponse.json({ error: 'Image introuvable' }, { status: 404 })

    const { Jimp } = await import('jimp')
    const img = await Jimp.read(media.buffer)
    // Downscale + crop central (50% central pour éviter murs, couches, ombres)
    const w = 60
    const h = Math.round((w / img.bitmap.width) * img.bitmap.height)
    img.resize({ w, h })
    // Zone centrale : 50% × 60% (favorise le sujet, ignore les bords)
    const cropX0 = Math.round(w * 0.25)
    const cropX1 = Math.round(w * 0.75)
    const cropY0 = Math.round(h * 0.20)
    const cropY1 = Math.round(h * 0.80)
    // Histogramme HSV — regroupe par hue (12 bins) + val
    const bins = new Map()   // key = hueBin → { count, sumR, sumG, sumB }
    for (let y = cropY0; y < cropY1; y++) {
      for (let x = cropX0; x < cropX1; x++) {
        const idx = (y * w + x) * 4
        const r = img.bitmap.data[idx]
        const g = img.bitmap.data[idx + 1]
        const b = img.bitmap.data[idx + 2]
        // Ignore pixels trop clairs (>235), trop sombres (<25) et trop peu saturés (murs, ombres)
        const brightness = (r + g + b) / 3
        if (brightness < 25 || brightness > 235) continue
        const max = Math.max(r, g, b), min = Math.min(r, g, b)
        const sat = max === 0 ? 0 : (max - min) / max
        if (sat < 0.15) continue
        // Hue en degrés (0-360)
        let hue = 0
        if (max === min) hue = 0
        else if (max === r) hue = 60 * (((g - b) / (max - min)) % 6)
        else if (max === g) hue = 60 * (((b - r) / (max - min)) + 2)
        else hue = 60 * (((r - g) / (max - min)) + 4)
        if (hue < 0) hue += 360
        const bin = Math.floor(hue / 30) // 12 bins de 30°
        const cur = bins.get(bin) || { count: 0, sumR: 0, sumG: 0, sumB: 0 }
        cur.count++
        cur.sumR += r; cur.sumG += g; cur.sumB += b
        bins.set(bin, cur)
      }
    }
    // Pick bin dominant (celui avec le plus de pixels)
    let best = null
    for (const [, val] of bins) {
      if (!best || val.count > best.count) best = val
    }
    let avgR, avgG, avgB
    if (best && best.count > 20) {
      avgR = Math.round(best.sumR / best.count)
      avgG = Math.round(best.sumG / best.count)
      avgB = Math.round(best.sumB / best.count)
    } else {
      // Fallback : moyenne globale du crop central
      let tr = 0, tg = 0, tb = 0, n = 0
      for (let y = cropY0; y < cropY1; y++) for (let x = cropX0; x < cropX1; x++) {
        const idx = (y * w + x) * 4
        tr += img.bitmap.data[idx]; tg += img.bitmap.data[idx + 1]; tb += img.bitmap.data[idx + 2]; n++
      }
      avgR = Math.round(tr / n); avgG = Math.round(tg / n); avgB = Math.round(tb / n)
    }

    // Convertit hex cible en RGB
    const cleanHex = targetHex.replace('#', '').padEnd(6, '0')
    const targetR = parseInt(cleanHex.slice(0, 2), 16)
    const targetG = parseInt(cleanHex.slice(2, 4), 16)
    const targetB = parseInt(cleanHex.slice(4, 6), 16)

    // Distance CIE-Lab
    const distance = labDistance([avgR, avgG, avgB], [targetR, targetG, targetB])

    // Seuil de tolérance : Delta-E 30 = perceptible mais acceptable, >50 = clairement différent
    const match = distance < 30

    const dominantHex = '#' + [avgR, avgG, avgB].map((c) => c.toString(16).padStart(2, '0')).join('')

    const message = match
      ? `Couleur cohérente (ΔE ${distance.toFixed(1)})`
      : `Couleur ${dominantHex} détectée, très différente du hex cible ${targetHex} (ΔE ${distance.toFixed(1)}) — vérifier`

    return NextResponse.json({
      ok: true,
      match,
      dominant: { r: avgR, g: avgG, b: avgB, hex: dominantHex },
      target: { r: targetR, g: targetG, b: targetB, hex: targetHex },
      distance: Number(distance.toFixed(2)),
      message,
    })
  } catch (e) {
    console.error('check-variant-color error', e)
    return NextResponse.json({ error: e.message || 'Échec analyse' }, { status: 500 })
  }
}

/* ========== Delta-E CIE76 ========== */
function rgbToLab([r, g, b]) {
  // sRGB → linéaire → XYZ
  const [rr, gg, bb] = [r, g, b].map((v) => {
    v /= 255
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  }).map((v) => v * 100)
  const X = rr * 0.4124 + gg * 0.3576 + bb * 0.1805
  const Y = rr * 0.2126 + gg * 0.7152 + bb * 0.0722
  const Z = rr * 0.0193 + gg * 0.1192 + bb * 0.9505
  const [x, y, z] = [X / 95.047, Y / 100, Z / 108.883].map((v) =>
    v > 0.008856 ? Math.cbrt(v) : (7.787 * v + 16 / 116)
  )
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
function labDistance(a, b) {
  const [l1, a1, b1] = rgbToLab(a)
  const [l2, a2, b2] = rgbToLab(b)
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}
