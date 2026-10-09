import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method }) {
  if (method !== 'POST') return null
  const body = await request.json().catch(() => ({}))
  const email = (body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  const db = await getDb()
  await db.collection('newsletter').updateOne(
    { email }, { $set: { email, createdAt: new Date() } }, { upsert: true }
  )
  return NextResponse.json({ ok: true })
}
