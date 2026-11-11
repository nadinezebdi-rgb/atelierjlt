import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { sendShippedEmail, emailConfigured } from '@/lib/email'

const ALLOWED = ['status', 'trackingNumber', 'carrier', 'trackingUrl', 'shippedAt', 'deliveredAt', 'paymentStatus', 'adminNote']

export async function handle({ request, method, url }) {
  const db = await getDb()
  if (method === 'GET') {
    const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
    return NextResponse.json({ orders, emailConfigured: emailConfigured() })
  }
  if (method === 'PATCH') {
    const id = url.searchParams.get('id')
    const body = await request.json().catch(() => ({}))
    const before = await db.collection('orders').findOne({ _id: id })
    if (!before) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })

    const set = {}
    for (const k of ALLOWED) if (k in body) set[k] = body[k]
    if (set.status === 'shipped' && !before.shippedAt && !set.shippedAt) set.shippedAt = new Date().toISOString()
    if (set.status === 'delivered' && !before.deliveredAt) set.deliveredAt = new Date().toISOString()
    if (Object.keys(set).length) await db.collection('orders').updateOne({ _id: id }, { $set: set })

    // Email « commande expédiée » : automatique au passage en Expédiée (une seule fois),
    // ou renvoi manuel avec { resendEmail: true }.
    let email = null
    const becameShipped = set.status === 'shipped' && before.status !== 'shipped'
    if ((becameShipped && !before.shippedEmailSentAt && body.notify !== false) || body.resendEmail) {
      const after = await db.collection('orders').findOne({ _id: id })
      email = await sendShippedEmail(after)
      if (email.ok) {
        await db.collection('orders').updateOne({ _id: id }, { $set: { shippedEmailSentAt: new Date().toISOString() } })
      }
    }
    return NextResponse.json({ ok: true, email })
  }
  return null
}
