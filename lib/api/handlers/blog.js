import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handle({ method, sub }) {
  const db = await getDb()

  if (method === 'GET' && !sub) {
    const list = await db.collection('blog_posts')
      .find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray()
    return NextResponse.json({ posts: list })
  }

  if (method === 'GET' && sub) {
    const post = await db.collection('blog_posts').findOne({ slug: sub, published: true })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ post })
  }

  return null
}
