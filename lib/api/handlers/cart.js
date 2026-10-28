import crypto from 'node:crypto'
import { v4 as uuid } from 'uuid'
import {
  NextResponse, getSid, setSidCookie,
  readCart, writeCart, cartResponse, toCartLine, findAnyProduct,
} from '../shared'
import { getClientUserId } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { availableUnits } from '@/lib/stock'
import { salesOpen, SALES_CLOSED_MESSAGE } from '@/lib/shop-settings'
import { sendGuestCartLinkEmail } from '@/lib/email'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const SAVED_CART_DAYS = 30

// Fusionne un panier sauvegardé dans le panier courant (même pièce/couleur/taille → quantité max)
function mergeItems(current = [], saved = []) {
  const out = current.map((i) => ({ ...i }))
  for (const s of saved) {
    const same = out.find((i) => i.slug === s.slug && (i.variant || null) === (s.variant || null) && (i.size || null) === (s.size || null))
    if (same) same.qty = Math.max(same.qty || 1, s.qty || 1)
    else out.push({ ...s })
  }
  return out
}

export async function handle({ request, method, url, sub }) {
  let sid = getSid(request)
  const body = ['POST', 'PATCH'].includes(method) ? await request.json().catch(() => ({})) : {}

  // Ventes fermées : pas de panier (lecture et retrait restent possibles)
  if ((method === 'POST' || method === 'PATCH') && !(await salesOpen())) {
    return NextResponse.json({ error: SALES_CLOSED_MESSAGE, salesClosed: true }, { status: 403 })
  }
  if (method === 'GET' && sub === 'restore' && !(await salesOpen())) {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '') || url.origin
    return NextResponse.redirect(`${base}/`, 302)
  }

  // ---- Visiteur : « Recevoir mon panier par e-mail » (envoi immédiat d'un lien, une fois) ----
  if (method === 'POST' && sub === 'save') {
    const email = String(body.email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    const items = await readCart(sid)
    if (!sid || !items.length) return NextResponse.json({ error: 'Votre panier est vide' }, { status: 400 })
    const db = await getDb()
    const cart = await db.collection('carts').findOne({ _id: sid })
    if (cart?.guestLinkSentAt && Date.now() - new Date(cart.guestLinkSentAt).getTime() < 2 * 60 * 1000) {
      return NextResponse.json({ error: 'Un e-mail vient déjà de partir. Patientez deux minutes avant de réessayer.' }, { status: 429 })
    }
    const token = crypto.randomBytes(24).toString('hex')
    await db.collection('saved_carts').insertOne({
      _id: token, email, items, source: 'cart', createdAt: new Date(),
      expiresAt: new Date(Date.now() + SAVED_CART_DAYS * 24 * 3600 * 1000),
    })
    const r = await sendGuestCartLinkEmail({ to: email, items, token })
    if (!r.ok) return NextResponse.json({ error: 'L’e-mail n’a pas pu partir. Réessayez dans un instant.' }, { status: 502 })
    await db.collection('carts').updateOne({ _id: sid }, { $set: { guestEmail: email, guestLinkSentAt: new Date(), guestEmailSource: 'cart' } })
    return NextResponse.json({ ok: true })
  }

  // ---- Visiteur : e-mail saisi au paiement (lien envoyé 3 h plus tard si la commande n'est pas finie) ----
  if (method === 'POST' && sub === 'checkout-email') {
    if (getClientUserId(request)) return NextResponse.json({ ok: true, skipped: 'logged_in' })
    const email = String(body.email || '').trim().toLowerCase()
    if (!EMAIL_RE.test(email) || !sid) return NextResponse.json({ ok: true, skipped: 'invalid' })
    const db = await getDb()
    await db.collection('carts').updateOne(
      { _id: sid, guestLinkSentAt: { $in: [null] } },
      { $set: { guestEmail: email, guestEmailAt: new Date(), guestEmailSource: 'checkout' } }
    )
    return NextResponse.json({ ok: true })
  }

  // ---- Lien reçu par e-mail : remet les pièces dans le panier puis ouvre le paiement ----
  if (method === 'GET' && sub === 'restore') {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '') || url.origin
    const token = url.searchParams.get('t') || ''
    const db = await getDb()
    const saved = token ? await db.collection('saved_carts').findOne({ _id: token }) : null
    if (!saved || (saved.expiresAt && new Date(saved.expiresAt) < new Date())) {
      return NextResponse.redirect(`${base}/?panier=expire`, 302)
    }
    if (!sid) sid = uuid()
    const merged = mergeItems(await readCart(sid), saved.items || [])
    await writeCart(sid, merged, getClientUserId(request))
    await db.collection('saved_carts').updateOne({ _id: token }, { $set: { restoredAt: new Date() }, $inc: { restoreCount: 1 } })
    const res = NextResponse.redirect(`${base}/checkout?panier=retrouve`, 302)
    setSidCookie(res, sid)
    return res
  }

  if (method === 'GET') return NextResponse.json(cartResponse(await readCart(sid)))

  if (method === 'POST') {
    if (!sid) sid = uuid()
    const { slug, qty = 1, variant = null, size = null } = body
    const product = await findAnyProduct(slug)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const items = await readCart(sid)
    const existing = items.find((i) =>
      i.slug === slug &&
      (i.variant || null) === variant &&
      (i.size || null) === size
    )
    const cap = availableUnits(product, variant, size)
    if (cap <= 0) return NextResponse.json({ error: 'Cette pièce est épuisée' }, { status: 409 })
    if (existing) existing.qty = Math.min(existing.qty + qty, cap)
    else items.push(toCartLine(product, Math.min(qty, cap), variant, size))
    await writeCart(sid, items, getClientUserId(request))
    const res = NextResponse.json(cartResponse(items))
    setSidCookie(res, sid)
    return res
  }

  if (method === 'PATCH') {
    if (!sid) sid = uuid()
    const { slug, qty, variant = null, size = null } = body
    const items = await readCart(sid)
    let line = items.find((i) =>
      i.slug === slug &&
      (variant === null || (i.variant || null) === variant) &&
      (size === null || (i.size || null) === size)
    )
    // Fallback slug-only : seulement si une seule ligne pour ce slug
    if (!line) {
      const matches = items.filter((i) => i.slug === slug)
      if (matches.length === 1) line = matches[0]
    }
    if (line) {
      const p = await findAnyProduct(slug)
      const cap = p ? availableUnits(p, line.variant || null, line.size || null) : 99
      line.qty = Math.max(1, Math.min(qty, Math.max(1, cap)))
    }
    await writeCart(sid, items, getClientUserId(request))
    const res = NextResponse.json(cartResponse(items))
    setSidCookie(res, sid)
    return res
  }

  if (method === 'DELETE') {
    if (!sid) return NextResponse.json(cartResponse([]))
    const slug = url.searchParams.get('slug')
    const variant = url.searchParams.get('variant')
    const size = url.searchParams.get('size')
    const items = (await readCart(sid)).filter((i) => {
      if (i.slug !== slug) return true
      if (variant !== null && (i.variant || '') !== (variant || '')) return true
      if (size !== null && (i.size || '') !== (size || '')) return true
      return false
    })
    await writeCart(sid, items, getClientUserId(request))
    return NextResponse.json(cartResponse(items))
  }

  return null
}
