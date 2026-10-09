import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'

export async function handleContent({ request, method }) {
  const db = await getDb()
  if (method === 'GET') {
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    return NextResponse.json({ content: doc?.content || null })
  }
  if (method === 'PATCH' || method === 'POST') {
    const body = await request.json()
    await db.collection('site_content').updateOne(
      { _id: 'home' },
      { $set: { content: body, updatedAt: new Date() } },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  }
  return null
}

export async function handleSettings({ request, method }) {
  const db = await getDb()
  if (method === 'GET') {
    const doc = await db.collection('site_settings').findOne({ _id: 'main' })
    return NextResponse.json({ settings: doc?.settings || null })
  }
  if (method === 'PATCH' || method === 'POST') {
    const body = await request.json()
    await db.collection('site_settings').updateOne(
      { _id: 'main' },
      { $set: { settings: body, updatedAt: new Date() } },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  }
  return null
}
