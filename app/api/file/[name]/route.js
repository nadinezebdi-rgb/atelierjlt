import fs from 'node:fs'
import path from 'node:path'

// Serveur de fichiers polyvalent — images, vidéos, PDF téléversés
// depuis l'admin. Les fichiers sont stockés dans /app/lib/product-images/
// (même dossier que les images produits pour simplifier la persistance).
// Le nom du fichier reçu inclut l'extension (ex : upload-abc123.mp4).

const FILES_DIR = path.join(process.cwd(), 'lib', 'product-images')

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  pdf: 'application/pdf',
}

function safeResolve(nameArg) {
  const raw = decodeURIComponent(nameArg || '')
  // Anti-traversal : on garde uniquement caractères sûrs
  if (!/^[a-zA-Z0-9._-]+$/.test(raw)) return null
  const p = path.join(FILES_DIR, raw)
  if (!p.startsWith(FILES_DIR)) return null
  if (!fs.existsSync(p)) return null
  const ext = (raw.split('.').pop() || '').toLowerCase()
  return { path: p, ext }
}

export async function GET(_request, { params }) {
  const p = await params
  const found = safeResolve(p.name)
  if (!found) return new Response('Not found', { status: 404 })
  try {
    const buffer = fs.readFileSync(found.path)
    const mime = MIME[found.ext] || 'application/octet-stream'
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': String(buffer.length),
        // Pour PDF, permettre l'affichage inline dans le navigateur
        ...(found.ext === 'pdf' ? { 'Content-Disposition': 'inline' } : {}),
      },
    })
  } catch (err) {
    console.error('file read error', err)
    return new Response('Server error', { status: 500 })
  }
}
