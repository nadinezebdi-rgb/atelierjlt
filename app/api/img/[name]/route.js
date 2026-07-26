import fs from 'node:fs'
import path from 'node:path'

// Images are stored in /app/lib/product-images/ (mirrored from /public/products) and
// explicitly included in the Next standalone build via outputFileTracingIncludes.
// This is a lightweight disk-based serving route (no huge JS blob in memory).

const IMG_DIR = path.join(process.cwd(), 'lib', 'product-images')
const FALLBACK_DIR = path.join(process.cwd(), 'public', 'products')

const EXTENSIONS = ['jpeg', 'jpg', 'webp', 'png']

function mimeFor(ext) {
  const e = ext.toLowerCase()
  if (e === 'jpg' || e === 'jpeg') return 'image/jpeg'
  if (e === 'webp') return 'image/webp'
  if (e === 'png') return 'image/png'
  return 'application/octet-stream'
}

function resolveImage(nameArg) {
  const raw = decodeURIComponent(nameArg || '')
  // strip extension if present
  const key = raw.replace(/\.(jpe?g|webp|png)$/i, '')
  for (const dir of [IMG_DIR, FALLBACK_DIR]) {
    for (const ext of EXTENSIONS) {
      const p = path.join(dir, `${key}.${ext}`)
      if (fs.existsSync(p)) return { path: p, ext }
    }
  }
  return null
}

export async function GET(_request, { params }) {
  const p = await params
  const found = resolveImage(p.name)
  if (!found) return new Response('Not found', { status: 404 })
  try {
    const buffer = fs.readFileSync(found.path)
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeFor(found.ext),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    console.error('img read error', err)
    return new Response('Server error', { status: 500 })
  }
}
