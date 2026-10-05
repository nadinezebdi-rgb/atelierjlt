import fs from 'fs'
import path from 'path'
import { loadMedia } from '@/lib/media-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert une image par nom.
 *   1. Cherche sur disque (images versionnées `jlt-*`, etc.)
 *   2. Fallback vers MongoDB (uploads persistés)
 *   3. Si non trouvé ET nom en `upload-*` (fichier utilisateur perdu),
 *      renvoie une image de secours du catalogue au lieu d'un 404 (évite
 *      les cadres gris sur la home après redéploiement / migration).
 *   4. Sinon 404.
 */
const FALLBACK_DISK_NAME = 'jlt-hero-beige.jpeg'
const FALLBACK_DIRS = [
  path.join(process.cwd(), 'lib', 'product-images'),
  path.join(process.cwd(), 'public', 'product-images'),
]

function loadFallback() {
  for (const dir of FALLBACK_DIRS) {
    const p = path.join(dir, FALLBACK_DISK_NAME)
    if (fs.existsSync(p)) {
      try {
        return { buffer: fs.readFileSync(p), contentType: 'image/jpeg' }
      } catch { /* ignore */ }
    }
  }
  return null
}

export async function GET(_request, { params }) {
  const p = await params
  const media = await loadMedia(p.name)
  if (media) {
    return new Response(media.buffer, {
      status: 200,
      headers: {
        'Content-Type': media.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(media.buffer.length),
      },
    })
  }

  // Fallback : pour les uploads perdus, on sert une image de secours plutôt qu'un 404
  const isLostUpload = typeof p.name === 'string' && /^upload-/i.test(p.name)
  if (isLostUpload) {
    const fb = loadFallback()
    if (fb) {
      return new Response(fb.buffer, {
        status: 200,
        headers: {
          'Content-Type': fb.contentType,
          // Cache court : au cas où l'admin re-uploade le vrai fichier
          'Cache-Control': 'public, max-age=300',
          'Content-Length': String(fb.buffer.length),
          'X-Fallback-Image': '1',
        },
      })
    }
  }

  return new Response('Not found', { status: 404 })
}
