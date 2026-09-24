'use client'

// Génération d'une miniature de la première page d'un PDF, côté client.
// Utilise pdfjs-dist avec le worker chargé depuis le CDN pour éviter
// les problèmes de bundling. Retourne un data URL JPEG compact.

let pdfjsPromise = null

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const pdfjs = await import('pdfjs-dist/build/pdf.mjs')
      // Worker depuis unpkg — évite le pipeline webpack
      pdfjs.GlobalWorkerOptions.workerSrc =
        'https://unpkg.com/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs'
      return pdfjs
    })()
  }
  return pdfjsPromise
}

/**
 * Génère une miniature JPEG de la première page d'un PDF.
 * @param {File|Blob|ArrayBuffer} source
 * @param {number} maxSide - Taille max en pixels du plus grand côté (default 400)
 * @returns {Promise<string>} data URL image/jpeg
 */
export async function generatePdfThumbnail(source, maxSide = 400) {
  try {
    const pdfjs = await loadPdfjs()
    const data = source instanceof ArrayBuffer
      ? source
      : await source.arrayBuffer()
    const pdf = await pdfjs.getDocument({ data }).promise
    const page = await pdf.getPage(1)
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = maxSide / Math.max(baseViewport.width, baseViewport.height)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.ceil(viewport.width)
    canvas.height = Math.ceil(viewport.height)
    const context = canvas.getContext('2d')

    await page.render({ canvasContext: context, viewport, canvas }).promise

    // Fond blanc pour PDF transparents
    return canvas.toDataURL('image/jpeg', 0.72)
  } catch (e) {
    console.warn('PDF thumbnail failed', e)
    return null
  }
}
