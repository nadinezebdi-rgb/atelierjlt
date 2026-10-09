import { v4 as uuid } from 'uuid'
import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, url }) {
  const db = await getDb()
  if (method === 'GET') {
    const posts = await db.collection('blog_posts').find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ posts })
  }
  if (method === 'POST') {
    const body = await request.json()
    const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
    if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 })
    const existing = await db.collection('blog_posts').findOne({ slug })
    if (existing) return NextResponse.json({ error: 'Un article utilise déjà ce slug' }, { status: 409 })
    const now = new Date()
    const post = {
      _id: uuid(),
      slug,
      title: body.title || 'Nouvel article',
      category: body.category || 'Journal',
      excerpt: body.excerpt || '',
      image: body.image || '',
      imageAlt: body.imageAlt || '',
      content: body.content || '',
      keywords: body.keywords || [],
      metaTitle: body.metaTitle || body.title || '',
      metaDescription: body.metaDescription || body.excerpt || '',
      author: body.author || 'Atelier JLT',
      readingTime: body.readingTime || '5 min',
      published: Boolean(body.published),
      publishedAt: body.published ? now : null,
      createdAt: now,
      updatedAt: now,
    }
    await db.collection('blog_posts').insertOne(post)
    return NextResponse.json({ ok: true, post })
  }
  if (method === 'PATCH') {
    const slug = url.searchParams.get('slug')
    const body = await request.json()
    const now = new Date()
    const current = await db.collection('blog_posts').findOne({ slug })
    if (!current) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
    const publishedAt = body.published && !current.publishedAt ? now : current.publishedAt
    const update = { ...body, updatedAt: now, publishedAt }
    delete update._id
    delete update.slug
    await db.collection('blog_posts').updateOne({ slug }, { $set: update })
    return NextResponse.json({ ok: true })
  }
  if (method === 'DELETE') {
    const slug = url.searchParams.get('slug')
    await db.collection('blog_posts').deleteOne({ slug })
    return NextResponse.json({ ok: true })
  }
  return null
}
