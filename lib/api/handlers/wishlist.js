import { NextResponse, loadProducts } from '../shared'
import { getDb } from '@/lib/db'
import { getClientUserId } from '@/lib/auth'

export async function handle({ request, method, url }) {
  const uid = getClientUserId(request)
  if (!uid) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
  const db = await getDb()

  if (method === 'GET') {
    const doc = await db.collection('wishlists').findOne({ _id: uid })
    const slugs = doc?.slugs || []
    const all = await loadProducts()
    const items = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean)
    return NextResponse.json({ items, slugs })
  }

  if (method === 'POST') {
    const { slug } = await request.json()
    await db.collection('wishlists').updateOne(
      { _id: uid },
      { $addToSet: { slugs: slug }, $set: { updatedAt: new Date() } },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  }

  if (method === 'DELETE') {
    const slug = url.searchParams.get('slug')
    await db.collection('wishlists').updateOne(
      { _id: uid }, { $pull: { slugs: slug } }
    )
    return NextResponse.json({ ok: true })
  }

  return null
}
