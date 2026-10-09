import { v4 as uuid } from 'uuid'
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method }) {
  if (method !== 'POST') return null
  const body = await request.json().catch(() => ({}))
  const { name = '', email = '', message = '' } = body
  if (!email.includes('@') || message.length < 5) {
    return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
  }
  const db = await getDb()
  await db.collection('contacts').insertOne({
    _id: uuid(), name, email, message, createdAt: new Date(),
  })
  return NextResponse.json({ ok: true })
}
