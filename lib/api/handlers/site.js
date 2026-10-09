import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handleSiteContent({ method }) {
  if (method !== 'GET') return null
  const db = await getDb()
  const doc = await db.collection('site_content').findOne({ _id: 'home' })
  return NextResponse.json({ content: doc?.content || null })
}

export async function handleSiteSettings({ method }) {
  if (method !== 'GET') return null
  const db = await getDb()
  const doc = await db.collection('site_settings').findOne({ _id: 'main' })
  return NextResponse.json({ settings: doc?.settings || null })
}
