import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, sub }) {
  if (sub === 'verify' && method === 'POST') {
    const { code } = await request.json().catch(() => ({}))
    const db = await getDb()
    const c = await db.collection('coupons').findOne({ code: (code || '').toUpperCase(), active: true })
    if (!c) return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 404 })
    return NextResponse.json({ valid: true, code: c.code, type: c.type, value: c.value, label: c.label })
  }
  return null
}
