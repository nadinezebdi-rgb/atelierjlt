import { v4 as uuid } from 'uuid'
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, sub }) {
  const db = await getDb()
  if (sub === 'verify' && method === 'POST') {
    const { code } = await request.json().catch(() => ({}))
    const g = await db.collection('gift_cards').findOne({ code: (code || '').toUpperCase() })
    if (!g) return NextResponse.json({ valid: false }, { status: 404 })
    return NextResponse.json({ valid: true, code: g.code, balance: g.balance })
  }
  if (method === 'POST') {
    const { amount, recipient = {}, buyerEmail = '' } = await request.json().catch(() => ({}))
    if (![30, 50, 100, 200].includes(amount)) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
    const code = 'GC-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    await db.collection('gift_cards').insertOne({
      _id: uuid(), code, initial: amount, balance: amount,
      recipient, buyerEmail, createdAt: new Date(),
    })
    return NextResponse.json({ ok: true, code, amount })
  }
  return null
}
