import { v4 as uuid } from 'uuid'
import { NextResponse, getSid, readCart, writeCart, loadProducts } from '../shared'
import { reserveStock } from '@/lib/catalog'
import { getShippingSettings, shippingCost, cleanRelay } from '@/lib/shipping-settings'
import { salesOpen, SALES_CLOSED_MESSAGE } from '@/lib/shop-settings'
import { getDb } from '@/lib/db'
import { getClientUserId, isAdmin } from '@/lib/auth'
import { sendOrderConfirmationEmail, sendOwnerNewOrderEmail, sendOwnerLowStockEmail } from '@/lib/email'

export async function handle({ request, method, sub }) {
  const uid = getClientUserId(request)
  const db = await getDb()

  // Suivi public : n° de commande + email → état (aucune donnée sensible renvoyée)
  if (method === 'GET' && sub === 'track') {
    const u = new URL(request.url)
    const number = (u.searchParams.get('number') || '').trim().toUpperCase()
    const email = (u.searchParams.get('email') || '').trim().toLowerCase()
    if (!number || !email) return NextResponse.json({ error: 'Numéro de commande et email requis' }, { status: 400 })
    const order = await db.collection('orders').findOne({ orderNumber: number })
    const orderEmail = String(order?.address?.email || '').trim().toLowerCase()
    if (!order || !orderEmail || orderEmail !== email) {
      return NextResponse.json({ error: 'Aucune commande ne correspond à ces informations.' }, { status: 404 })
    }
    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        status: order.status || 'received',
        createdAt: order.createdAt,
        shippedAt: order.shippedAt || null,
        deliveredAt: order.deliveredAt || null,
        carrier: order.carrier || null,
        trackingNumber: order.trackingNumber || null,
        trackingUrl: order.trackingUrl || null,
        itemsCount: (order.items || []).reduce((n, i) => n + (i.qty || 1), 0),
      },
    })
  }

  if (method === 'GET' && sub) {
    const order = await db.collection('orders').findOne({ _id: sub })
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!isAdmin(request) && order.userId !== uid) {
      return NextResponse.json({ error: 'Interdit' }, { status: 403 })
    }
    return NextResponse.json({ order })
  }

  if (method === 'GET') {
    if (isAdmin(request)) {
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
      return NextResponse.json({ orders })
    }
    if (!uid) return NextResponse.json({ orders: [] })
    const orders = await db.collection('orders').find({ userId: uid }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ orders })
  }

  if (method === 'POST') {
    // Aucune commande sans paiement : refusée tant que les ventes ne sont pas ouvertes
    if (!(await salesOpen())) return NextResponse.json({ error: SALES_CLOSED_MESSAGE, salesClosed: true }, { status: 403 })
    const sid = getSid(request)
    const items = await readCart(sid)
    if (items.length === 0) return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const { address = {}, couponCode, giftCardCode } = body

    // Stock : on vérifie puis on retire les pièces commandées (couleur / taille comprises)
    const stock = await reserveStock(db, items, await loadProducts())
    if (!stock.ok) {
      const p = stock.problems[0]
      const what = [p.name, p.variant, p.size].filter(Boolean).join(' — ')
      const msg = p.available > 0
        ? `Il ne reste ${p.available > 1 ? `que ${p.available} pièces` : 'qu’une pièce'} pour « ${what} ». Ajustez la quantité dans votre panier.`
        : `« ${what} » vient d’être épuisé. Retirez-le de votre panier pour continuer.`
      return NextResponse.json({ error: msg, problems: stock.problems }, { status: 409 })
    }

    let subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
    let discount = 0
    let couponInfo = null
    if (couponCode) {
      const c = await db.collection('coupons').findOne({ code: couponCode.toUpperCase(), active: true })
      if (c) {
        discount = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value
        couponInfo = { code: c.code, value: discount }
      }
    }
    let giftCredit = 0
    if (giftCardCode) {
      const g = await db.collection('gift_cards').findOne({ code: giftCardCode.toUpperCase() })
      if (g && g.balance > 0) {
        giftCredit = Math.min(g.balance, Math.max(0, subtotal - discount))
        await db.collection('gift_cards').updateOne({ code: g.code }, { $inc: { balance: -giftCredit } })
      }
    }
    // Plus de livraison offerte : Standard 8,90 € · Express 14,90 €
    const shipSettings = await getShippingSettings()
    let method = ['express', 'relay'].includes(address.shippingMethod) ? address.shippingMethod : 'standard'
    if (method === 'relay' && !shipSettings.relayEnabled) method = 'standard'
    let relay = null
    if (method === 'relay') {
      relay = cleanRelay(address.relay)
      if (!relay) return NextResponse.json({ error: 'Choisissez un point relais sur la carte.' }, { status: 400 })
    }
    address.shippingMethod = method
    if (relay) address.relay = relay; else delete address.relay
    const shipping = shippingCost(method, shipSettings)
    const total = Math.max(0, subtotal - discount - giftCredit) + shipping

    const orderId = uuid()
    const orderNumber = 'JLT-' + Date.now().toString(36).toUpperCase()
    const order = {
      _id: orderId, orderNumber,
      userId: uid || null,
      items, address,
      subtotal, discount, giftCredit, shipping, total,
      coupon: couponInfo,
      status: 'received', paymentStatus: 'pending',
      createdAt: new Date(),
    }
    await db.collection('orders').insertOne(order)
    if (sid) await writeCart(sid, [])
    if (uid) await db.collection('users').updateOne({ _id: uid }, { $inc: { loyaltyPoints: Math.round(total) } })

    // Emails : confirmation au client + alerte « nouvelle commande » à l'atelier.
    // Un échec d'envoi ne bloque jamais la commande.
    const [conf, owner] = await Promise.all([
      sendOrderConfirmationEmail(order).catch(() => ({ ok: false })),
      sendOwnerNewOrderEmail(order).catch(() => ({ ok: false })),
      stock.low?.length ? sendOwnerLowStockEmail({ order, items: stock.low }).catch(() => ({ ok: false })) : null,
    ])
    const emailSet = {}
    if (conf?.ok) emailSet.confirmationEmailSentAt = new Date().toISOString()
    if (owner?.ok) emailSet.ownerNotifiedAt = new Date().toISOString()
    if (Object.keys(emailSet).length) await db.collection('orders').updateOne({ _id: orderId }, { $set: emailSet })
    return NextResponse.json({ ok: true, order: { ...order, ...emailSet }, email: { confirmation: !!conf?.ok, owner: !!owner?.ok } })
  }

  return null
}
