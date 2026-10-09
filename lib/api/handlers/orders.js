import { v4 as uuid } from 'uuid'
import { NextResponse, getSid, readCart, writeCart } from '../shared'
import { getDb } from '@/lib/db'
import { getClientUserId, isAdmin } from '@/lib/auth'

export async function handle({ request, method, sub }) {
  const uid = getClientUserId(request)
  const db = await getDb()

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
    // Create order (checkout — payment simulation for now)
    const sid = getSid(request)
    const items = await readCart(sid)
    if (items.length === 0) return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
    const body = await request.json().catch(() => ({}))
    const { address = {}, couponCode, giftCardCode } = body

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
    const shipping = subtotal >= 150 ? 0 : 8.9
    const total = Math.max(0, subtotal - discount - giftCredit) + shipping

    const orderId = uuid()
    const orderNumber = 'GIN-' + Date.now().toString(36).toUpperCase()
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
    return NextResponse.json({ ok: true, order })
  }

  return null
}
