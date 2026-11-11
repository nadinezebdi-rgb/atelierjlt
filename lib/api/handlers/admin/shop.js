import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { getShopSettings, paymentReady } from '@/lib/shop-settings'
import { getShippingSettings, sanitizeBrand } from '@/lib/shipping-settings'

// GET   /api/admin/shop                → réglages + nombre d'inscrits à l'ouverture
// PATCH /api/admin/shop { salesOpen }   → impossible d'ouvrir sans paiement en ligne
export async function handle({ request, method, sub2 }) {
  const db = await getDb()
  // Livraison : point relais on/off, prix, code enseigne Mondial Relay
  if (sub2 === 'shipping') {
    if (method === 'GET') return NextResponse.json(await getShippingSettings())
    if (method === 'PATCH') {
      const b = await request.json().catch(() => ({}))
      const set = { updatedAt: new Date() }
      if (typeof b.relayEnabled === 'boolean') set.relayEnabled = b.relayEnabled
      if (b.relayPrice !== undefined) {
        const p = Number(String(b.relayPrice).replace(',', '.'))
        if (!Number.isFinite(p) || p < 0 || p > 100) return NextResponse.json({ error: 'Prix invalide' }, { status: 400 })
        set.relayPrice = Math.round(p * 100) / 100
      }
      if (b.mrBrand !== undefined) set.mrBrand = sanitizeBrand(b.mrBrand)
      await db.collection('site_settings').updateOne({ _id: 'shipping' }, { $set: set }, { upsert: true })
      return NextResponse.json({ ok: true, ...(await getShippingSettings()) })
    }
    return null
  }
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
