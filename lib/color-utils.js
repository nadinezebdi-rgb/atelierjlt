/**
 * Color / contrast utilities used by the Hero composer.
 *
 * Auto-contrast strategy:
 * 1. Load the target image into an off-screen <canvas> (browser only)
 * 2. Sample a rectangle around the text coordinates (in %)
 * 3. Compute perceived luminance (WCAG formula)
 * 4. Return 'white' or 'black' for the text color
 *
 * All functions are pure (no side-effects) and safe to call from React effects.
 */

/**
 * Compute WCAG relative luminance (0 → 1) for an sRGB pixel.
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function relativeLuminance(r, g, b) {
  const srgb = [r, g, b].map((v) => v / 255).map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  )
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/**
 * Given the average luminance of a background zone, decide text color.
 * Threshold 0.55 (slightly above the mathematical 0.5) works better in
 * practice because human eyes over-weight bright zones as "too washed out".
 */
export function pickTextColor(luminance, threshold = 0.55) {
  return luminance > threshold ? 'black' : 'white'
}

/**
 * Sample average luminance around (xPct, yPct) inside an <img> element.
 * Falls back to full-image average if coords are missing.
 *
 * @param {HTMLImageElement} img  — must be loaded and crossOrigin-safe
 * @param {number}           xPct — text X coord in %, 0-100
 * @param {number}           yPct — text Y coord in %, 0-100
 * @param {number}           windowPct — sampling window size in %, default 30
 */
export function sampleImageLuminance(img, xPct = 50, yPct = 50, windowPct = 30) {
  if (typeof document === 'undefined') return 0.5
  if (!img || !img.complete || !img.naturalWidth) return 0.5
  try {
    const canvas = document.createElement('canvas')
    // Downscale for performance — 200px max
    const w = Math.min(200, img.naturalWidth)
    const h = Math.round((w / img.naturalWidth) * img.naturalHeight)
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return 0.5
    ctx.drawImage(img, 0, 0, w, h)
    const winW = Math.max(4, Math.round((windowPct / 100) * w))
    const winH = Math.max(4, Math.round((windowPct / 100) * h))
    const cx = Math.round((xPct / 100) * w)
    const cy = Math.round((yPct / 100) * h)
    const x0 = Math.max(0, Math.min(w - winW, cx - Math.round(winW / 2)))
    const y0 = Math.max(0, Math.min(h - winH, cy - Math.round(winH / 2)))
    const { data } = ctx.getImageData(x0, y0, winW, winH)
    let sum = 0
    let n = 0
    for (let i = 0; i < data.length; i += 4) {
      sum += relativeLuminance(data[i], data[i + 1], data[i + 2])
      n++
    }
    return n > 0 ? sum / n : 0.5
  } catch (e) {
    // CORS / tainted canvas → fallback
    return 0.5
  }
}

/**
 * Convert absolute pointer coords (relative to a container) to % coords.
 * Clamps to [0, 100] on both axes.
 */
export function pxToPct(px, py, rect) {
  const x = ((px - rect.left) / rect.width) * 100
  const y = ((py - rect.top) / rect.height) * 100
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
}
