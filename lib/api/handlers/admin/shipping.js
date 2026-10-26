// Admin — étiquettes affranchies (Colissimo / Boxtal).
//   GET  /api/admin/shipping                → état des connexions + offres Boxtal
//   POST /api/admin/shipping                → { orderId, provider, weight, length, width, height, offerCode }
//   GET  /api/admin/shipping?label=<orderId> → PDF de l'étiquette Colissimo
import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { boxtalConfigured, boxtalOffers, createBoxtalShipment } from '@/lib/shipping/boxtal'
import { colissimoConfigured, createColissimoLabel } from '@/lib/shipping/colissimo'
import { sendShippedEmail, emailConfigured } from '@/lib/email'

export async function handle({ request, method, url }) {
  const db = await getDb()

  if (method === 'GET') {
    const labelFor = url.searchParams.get('label')
    if (labelFor) {
      const doc = await db.collection('shipping_labels').findOne({ _id: labelFor })
      if (!doc?.pdfBase64) return NextResponse.json({ error: 'Étiquette introuvable' }, { status: 404 })
      return new NextResponse(Buffer.from(doc.pdfBase64, 'base64'), {
        headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="etiquette-${doc.orderNumber || labelFor}.pdf"` },
      })
    }
    return NextResponse.json({
      colissimo: colissimoConfigured(),
      boxtal: boxtalConfigured(),
      boxtalOffers: boxtalOffers(),
      email: emailConfigured(),
    })
  }

  if (method === 'POST') {
    const b = await request.json().catch(() => ({}))
    const order = await db.collection('orders').findOne({ _id: b.orderId })
    if (!order) return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 })
    const weight = Number(b.weight)
    if (!(weight > 0)) return NextResponse.json({ error: 'Indiquez le poids du colis (kg).' }, { status: 400 })
    const a = order.address || {}
    if (!a.address || !a.zip || !a.city) return NextResponse.json({ error: 'Adresse du client incomplète.' }, { status: 400 })

    const settings = (await db.collection('site_settings').findOne({ _id: 'main' }))?.settings || {}
    const sender = { senderName: 'Atelier JLT', ...(settings.shipping || {}) }
    const parcel = { weight, length: Number(b.length) || 30, width: Number(b.width) || 20, height: Number(b.height) || 10 }

    try {
      let result
      if (b.provider === 'colissimo') {
        if (!colissimoConfigured()) return NextResponse.json({ error: 'Colissimo n’est pas encore connecté.' }, { status: 400 })
        result = await createColissimoLabel({ order, sender, parcel })
        await db.collection('shipping_labels').updateOne(
          { _id: order._id },
          { $set: { orderNumber: order.orderNumber, pdfBase64: result.pdfBase64, createdAt: new Date() } },
          { upsert: true }
        )
        result.labelUrl = `/api/admin/shipping?label=${encodeURIComponent(order._id)}`
        delete result.pdfBase64
      } else if (b.provider === 'boxtal') {
        if (!boxtalConfigured()) return NextResponse.json({ error: 'Boxtal n’est pas encore connecté.' }, { status: 400 })
        const offers = boxtalOffers()
        const offerCode = b.offerCode || offers[0]
        if (!offerCode || (offers.length && !offers.includes(offerCode))) {
          return NextResponse.json({ error: 'Aucune offre Boxtal configurée.' }, { status: 400 })
        }
        result = await createBoxtalShipment({ order, sender, parcel, offerCode })
      } else {
        return NextResponse.json({ error: 'Transporteur inconnu' }, { status: 400 })
      }

      const set = {
        carrierLabel: { ...result, weight, createdAt: new Date().toISOString() },
        carrier: b.provider === 'colissimo' ? 'colissimo' : (order.carrier || 'other'),
      }
      if (result.trackingNumber) set.trackingNumber = result.trackingNumber
      if (result.trackingUrl) set.trackingUrl = result.trackingUrl
      if (result.trackingNumber && order.status !== 'shipped' && order.status !== 'delivered') {
        set.status = 'shipped'
        set.shippedAt = new Date().toISOString()
      }
      await db.collection('orders').updateOne({ _id: order._id }, { $set: set })

      let email = null
      if (set.status === 'shipped' && !order.shippedEmailSentAt) {
        const after = await db.collection('orders').findOne({ _id: order._id })
        email = await sendShippedEmail(after)
        if (email.ok) await db.collection('orders').updateOne({ _id: order._id }, { $set: { shippedEmailSentAt: new Date().toISOString() } })
      }
      return NextResponse.json({ ok: true, label: set.carrierLabel, email })
    } catch (e) {
      console.error('[shipping]', b.provider, e?.status, e?.message)
      return NextResponse.json({ error: e?.message || 'Création de l’étiquette impossible' }, { status: e?.status && e.status < 500 ? e.status : 502 })
    }
  }
  return null
}
