import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'

// Cleanup orphan files : scanne les URLs référencées et retire les fichiers upload-* non utilisés
export async function handle({ method, url }) {
  if (method === 'GET') {
    try {
      const fs = await import('node:fs')
      const path = await import('node:path')
      const dir = path.join(process.cwd(), 'lib', 'product-images')
      if (!fs.existsSync(dir)) return NextResponse.json({ orphans: [], total: 0, referenced: 0 })
      const onDisk = fs.readdirSync(dir).filter((f) => !f.startsWith('.'))

      const referenced = new Set()
      const scanForUrls = (val) => {
        if (!val) return
        if (typeof val === 'string') {
          const matches = val.match(/\/api\/(img|file)\/[a-zA-Z0-9._-]+/g)
          if (matches) matches.forEach((m) => referenced.add(m))
        } else if (Array.isArray(val)) {
          val.forEach(scanForUrls)
        } else if (typeof val === 'object') {
          Object.values(val).forEach(scanForUrls)
        }
      }

      const db = await getDb()
      const site = await db.collection('site_content').findOne({ _id: 'home' })
      if (site) scanForUrls(site.content)
      const products = await db.collection('products').find({}).toArray()
      scanForUrls(products)
      const posts = await db.collection('blog_posts').find({}).toArray()
      scanForUrls(posts)
      const users = await db.collection('users').find({}, { projection: { avatar: 1 } }).toArray()
      scanForUrls(users)

      const referencedFiles = new Set()
      referenced.forEach((u) => {
        const name = u.split('/').pop()
        if (u.includes('/api/img/')) {
          const match = onDisk.find((f) => {
            const base = f.replace(/\.(jpe?g|webp|png|gif)$/i, '')
            return base === name
          })
          if (match) referencedFiles.add(match)
          else referencedFiles.add(name)
        } else {
          referencedFiles.add(name)
        }
      })

      const orphans = onDisk
        .filter((f) => f.startsWith('upload-'))
        .filter((f) => !referencedFiles.has(f))
        .map((f) => {
          const stat = fs.statSync(path.join(dir, f))
          return { filename: f, size: stat.size, mtime: stat.mtime }
        })
        .sort((a, b) => b.size - a.size)

      const totalOrphanSize = orphans.reduce((sum, f) => sum + f.size, 0)

      return NextResponse.json({
        orphans,
        total: onDisk.length,
        referenced: referencedFiles.size,
        totalOrphanSize,
        uploadCount: onDisk.filter((f) => f.startsWith('upload-')).length,
      })
    } catch (e) {
      console.error('files scan error', e)
      return NextResponse.json({ error: 'Scan failed', details: String(e?.message || e) }, { status: 500 })
    }
  }

  if (method === 'DELETE') {
    try {
      const filename = url.searchParams.get('filename')
      if (!filename || !/^upload-[a-zA-Z0-9._-]+$/.test(filename)) {
        return NextResponse.json({ error: 'Nom de fichier invalide (uploads seulement)' }, { status: 400 })
      }
      const fs = await import('node:fs')
      const path = await import('node:path')
      const filePath = path.join(process.cwd(), 'lib', 'product-images', filename)
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Fichier introuvable' }, { status: 404 })
      }
      fs.unlinkSync(filePath)
      return NextResponse.json({ ok: true })
    } catch (e) {
      console.error('file delete error', e)
      return NextResponse.json({ error: 'Delete failed', details: String(e?.message || e) }, { status: 500 })
    }
  }

  return null
}
