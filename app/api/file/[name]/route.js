import { loadMedia } from '@/lib/media-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Sert un fichier (image, vidéo, PDF) par nom.
 *   1. Disque local (fichiers versionnés)
 *   2. Fallback MongoDB (uploads persistants)
 */
export async function GET(_request, { params }) {
  const p = await params
  const media = await loadMedia(p.name)
  if (!media) return new Response('Not found', { status: 404 })
  const headers = {
    'Content-Type': media.contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Length': String(media.buffer.length),
  }
  if (media.contentType === 'application/pdf') {
    headers['Content-Disposition'] = 'inline'
  }
  return new Response(media.buffer, { status: 200, headers })
}
