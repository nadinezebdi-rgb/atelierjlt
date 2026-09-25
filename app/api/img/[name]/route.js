import { loadMedia } from '@/lib/media-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert une image par nom.
 *   1. Cherche sur disque (images versionnées `jlt-*`, etc.)
 *   2. Fallback vers MongoDB (uploads persistés)
 * Renvoie 404 si non trouvée.
 */
export async function GET(_request, { params }) {
  const p = await params
  const media = await loadMedia(p.name)
  if (!media) return new Response('Not found', { status: 404 })
  return new Response(media.buffer, {
    status: 200,
    headers: {
      'Content-Type': media.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(media.buffer.length),
    },
  })
}
