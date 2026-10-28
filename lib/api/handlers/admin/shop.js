import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { getShopSettings, paymentReady } from '@/lib/shop-settings'

// GET   /api/admin/shop                → réglages + nombre d'inscrits à l'ouverture
// PATCH /api/admin/shop { salesOpen }   → impossible d'ouvrir sans paiement en ligne
export async function handle({ request, method }) {
  const db = await getDb()
  if (method === 'GET') {
    const s = await getShopSettings()
    const waitlist = await db.collection('sales_waitlist').countDocuments({})
    return NextResponse.json({ ...s, waitlist })
  }
  if (method === 'PATCH') {
    const body = await request.json().catch(() => ({}))
    const open = !!body.salesOpen
    if (open && !paymentReady()) {
      return NextResponse.json({ error: 'Impossible d’ouvrir les ventes : aucun paiement en ligne n’est encore branché.' }, { status: 409 })
    }
    await db.collection('site_settings').updateOne(
      { _id: 'shop' }, { $set: { salesOpen: open, updatedAt: new Date() } }, { upsert: true }
    )
    return NextResponse.json({ ok: true, ...(await getShopSettings()) })
  }
  return null
}
