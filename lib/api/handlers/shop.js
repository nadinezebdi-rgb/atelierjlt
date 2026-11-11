import { v4 as uuid } from 'uuid'
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'
import { getShopSettings } from '@/lib/shop-settings'
import { getShippingSettings } from '@/lib/shipping-settings'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// GET  /api/shop/status          → { salesOpen }
// POST /api/shop/notify {email, slug?} → inscription « prévenez-moi de l'ouverture des ventes »
export async function handle({ request, method, sub }) {
  if (method === 'GET' && sub === 'status') {
    const s = await getShopSettings()
    return NextResponse.json({ salesOpen: s.salesOpen })
  }
  if (method === 'GET' && sub === 'shipping') {
    const s = await getShippingSettings()
    return NextResponse.json(s)
  }
  if (method === 'POST' && sub === 'notify') {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    const db = await getDb()
    await db.collection('sales_waitlist').updateOne(
      { email },
      { $setOnInsert: { _id: uuid(), email, createdAt: new Date() }, $addToSet: { slugs: String(body.slug || '').slice(0, 120) || 'site' } },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  }
  return null
}
