/**
 * Analyse de la couleur dominante d'une image (jimp) + comparaison colorimétrique.
 * Utilisé par /api/admin/check-variant-color et /api/admin/auto-assign-variant.
 */

/** Extrait la couleur dominante d'un buffer image via jimp. */
export async function extractDominantColor(buffer) {
  const { Jimp } = await import('jimp')
  const img = await Jimp.read(buffer)
  const w = 60
  const h = Math.round((w / img.bitmap.width) * img.bitmap.height)
  img.resize({ w, h })
  // Crop central 50% × 60%
  const cropX0 = Math.round(w * 0.25)
  const cropX1 = Math.round(w * 0.75)
  const cropY0 = Math.round(h * 0.20)
  const cropY1 = Math.round(h * 0.80)
  const bins = new Map()
  for (let y = cropY0; y < cropY1; y++) {
    for (let x = cropX0; x < cropX1; x++) {
      const idx = (y * w + x) * 4
      const r = img.bitmap.data[idx]
      const g = img.bitmap.data[idx + 1]
      const b = img.bitmap.data[idx + 2]
      const brightness = (r + g + b) / 3
      if (brightness < 25 || brightness > 235) continue
      const max = Math.max(r, g, b), min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      if (sat < 0.15) continue
      let hue = 0
      if (max === min) hue = 0
      else if (max === r) hue = 60 * (((g - b) / (max - min)) % 6)
      else if (max === g) hue = 60 * (((b - r) / (max - min)) + 2)
      else hue = 60 * (((r - g) / (max - min)) + 4)
      if (hue < 0) hue += 360
      const bin = Math.floor(hue / 30)
      const cur = bins.get(bin) || { count: 0, sumR: 0, sumG: 0, sumB: 0 }
      cur.count++
      cur.sumR += r; cur.sumG += g; cur.sumB += b
      bins.set(bin, cur)
    }
  }
  let best = null
  for (const [, val] of bins) if (!best || val.count > best.count) best = val
  if (best && best.count > 20) {
    return {
      r: Math.round(best.sumR / best.count),
      g: Math.round(best.sumG / best.count),
      b: Math.round(best.sumB / best.count),
      confident: true,
    }
  }
  // Fallback moyenne crop central
  let tr = 0, tg = 0, tb = 0, n = 0
  for (let y = cropY0; y < cropY1; y++) for (let x = cropX0; x < cropX1; x++) {
    const idx = (y * w + x) * 4
    tr += img.bitmap.data[idx]; tg += img.bitmap.data[idx + 1]; tb += img.bitmap.data[idx + 2]; n++
  }
  return {
    r: Math.round(tr / n), g: Math.round(tg / n), b: Math.round(tb / n),
    confident: false,
  }
}

/** Convertit hex #RGB → {r,g,b}. */
export function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '').padEnd(6, '0')
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  }
}

/** Convertit {r,g,b} en hex #RRGGBB. */
export function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('')
}

/** Delta-E CIE76 entre deux triplets RGB. */
export function labDistance(a, b) {
  const [l1, a1, b1] = rgbToLab(a)
  const [l2, a2, b2] = rgbToLab(b)
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2)
}

function rgbToLab({ r, g, b }) {
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

/**
 * Trouve la variante dont le hex est le plus proche de la couleur dominante.
 * Retourne { index, variant, distance, confidence }.
 */
export function findClosestVariant(dominantRgb, variants) {
  if (!Array.isArray(variants) || variants.length === 0) return null
  let best = null
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    if (!v?.hex) continue
    const d = labDistance(dominantRgb, hexToRgb(v.hex))
    if (!best || d < best.distance) best = { index: i, variant: v, distance: d }
  }
  return best
}
