import { NextResponse } from 'next/server'
import * as products from '@/lib/api/handlers/products'
import * as cart from '@/lib/api/handlers/cart'
import * as auth from '@/lib/api/handlers/auth'
import * as wishlist from '@/lib/api/handlers/wishlist'
import * as orders from '@/lib/api/handlers/orders'
import * as coupons from '@/lib/api/handlers/coupons'
import * as giftCards from '@/lib/api/handlers/gift-cards'
import * as admin from '@/lib/api/handlers/admin'
import * as blog from '@/lib/api/handlers/blog'
import * as site from '@/lib/api/handlers/site'
import * as newsletter from '@/lib/api/handlers/newsletter'
import * as contact from '@/lib/api/handlers/contact'

// -------------------- MAIN DISPATCHER --------------------
// Thin router : chaque domaine est g\u00e9r\u00e9 par un handler s\u00e9par\u00e9 dans /lib/api/handlers
async function handler(request, { params }) {
  const method = request.method
  const path = (await params).path || []
  const [root, sub, sub2] = path
  const url = new URL(request.url)
  const ctx = { request, method, path, root, sub, sub2, url }

  try {
    if (!root) return NextResponse.json({ message: 'Atelier JLT API', ok: true })

    let res = null
    switch (root) {
      case 'products':      res = await products.handle(ctx); break
      case 'cart':          res = await cart.handle(ctx); break
      case 'auth':          res = await auth.handle(ctx); break
      case 'wishlist':      res = await wishlist.handle(ctx); break
      case 'orders':        res = await orders.handle(ctx); break
      case 'coupons':       res = await coupons.handle(ctx); break
      case 'gift-cards':    res = await giftCards.handle(ctx); break
      case 'admin':         res = await admin.handle(ctx); break
      case 'blog':          res = await blog.handle(ctx); break
      case 'site-content':  res = await site.handleSiteContent(ctx); break
      case 'site-settings': res = await site.handleSiteSettings(ctx); break
      case 'newsletter':    res = await newsletter.handle(ctx); break
      case 'contact':       res = await contact.handle(ctx); break
    }

    if (res) return res
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('API error', err)
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
