import { IMAGE_B64, IMAGE_MIME } from '@/lib/data/image-blobs'

export async function GET(request, { params }) {
  const p = await params
  const raw = decodeURIComponent(p.name || '')
  // Accept both "bijou-01" and "bijou-01.jpeg"
  const key = raw.replace(/\.(jpe?g|webp|png)$/i, '')

  const b64 = IMAGE_B64[key]
  const mime = IMAGE_MIME[key]

  if (!b64) {
    return new Response('Not found', { status: 404 })
  }

  const buffer = Buffer.from(b64, 'base64')

  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': mime || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(buffer.length),
    },
  })
}
