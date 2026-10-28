import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'
import {
  sendMail, emailConfigured, emailLayout, escHtml, ownerEmail,
  buildOrderConfirmation, buildOwnerNewOrder, buildShipped, buildPasswordReset,
  buildBackInStock, buildWelcome, buildCartReminder,
} from '@/lib/email'
import { runCartReminders, cartRemindersSummary } from '@/lib/cart-reminders'

export const PREVIEW_KINDS = [
  ['welcome', 'Bienvenue (nouveau compte)'],
  ['order_confirmation', 'Confirmation de commande'],
  ['owner_new_order', 'Nouvelle commande (pour vous)'],
  ['order_shipped', 'Colis expédié + suivi'],
  ['back_in_stock', 'Retour en stock'],
  ['cart_reminder_1', 'Panier abandonné — 1re relance'],
  ['cart_reminder_2', 'Panier abandonné — 2e relance'],
  ['password_reset', 'Mot de passe oublié'],
]

// Données d'exemple : vraies pièces du catalogue, client fictif.
async function sampleData() {
  const products = (await loadProducts()).filter((p) => p?.name && p?.price)
  const pick = products.slice(0, 2)
  const items = pick.length
    ? pick.map((p, i) => ({
        slug: p.slug, name: p.name, price: p.price, qty: 1,
        variant: p.variants?.[0]?.name || null, size: null,
        image: p.variants?.[0]?.image || p.images?.[0] || null,
      }))
    : [{ slug: 'exemple', name: 'Coussin en lin lavé', price: 49, qty: 1, variant: 'Sauge', image: null }]
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const address = {
    firstName: 'Camille', lastName: 'Martin', name: 'Camille Martin', email: 'camille.martin@exemple.fr',
    address: '12 rue des Oliviers', apt: '', zip: '13100', city: 'Aix-en-Provence', country: 'France',
    phone: '06 12 34 56 78', shippingMethod: 'standard',
  }
  const order = {
    _id: 'apercu', orderNumber: 'JLT-APERCU', items, address,
    subtotal, discount: 0, giftCredit: 0, shipping: 8.9, total: subtotal + 8.9,
    carrier: 'colissimo', trackingNumber: '6A12345678901',
  }
  return { order, items, product: pick[0] || { slug: 'exemple', name: 'Coussin en lin lavé', images: [] } }
}

async function buildPreview(kind) {
  const { order, items, product } = await sampleData()
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  switch (kind) {
    case 'welcome': return buildWelcome({ to: order.address.email, name: 'Camille' })
    case 'order_confirmation': return buildOrderConfirmation(order)
    case 'owner_new_order': return buildOwnerNewOrder(order)
    case 'order_shipped': return buildShipped(order)
    case 'back_in_stock': return buildBackInStock({ to: order.address.email, product, detail: product.variants?.[0]?.name || '' })
    case 'cart_reminder_1': return buildCartReminder({ to: order.address.email, name: 'Camille', items, step: 1, userId: 'apercu' })
    case 'cart_reminder_2': return buildCartReminder({ to: order.address.email, name: 'Camille', items, step: 2, userId: 'apercu' })
    case 'password_reset': return buildPasswordReset({ to: order.address.email, name: 'Camille', link: `${base}/compte/reinitialiser?token=apercu` })
    default: return null
  }
}

// GET  /api/admin/emails                 → état de l'envoi + 50 derniers emails + paniers en relance
// GET  /api/admin/emails/preview?kind=…  → { subject, html, text } (aperçu, rien n'est envoyé)
// POST /api/admin/emails {to, kind?}     → email de test (kind = modèle à envoyer en test)
// POST /api/admin/emails/run-reminders   → lance les relances panier dues maintenant
export async function handle({ request, method, sub2, url }) {
  const db = await getDb()

  if (method === 'GET' && sub2 === 'preview') {
    const kind = url.searchParams.get('kind') || 'welcome'
    const mail = await buildPreview(kind)
    if (!mail) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
    return NextResponse.json({ kind, subject: mail.subject, html: mail.html, text: mail.text, kinds: PREVIEW_KINDS })
  }

  if (method === 'POST' && sub2 === 'run-reminders') {
    const r = await runCartReminders()
    return NextResponse.json({ ok: true, ...r })
  }

  if (method === 'GET') {
    const logs = await db.collection('email_logs').find({}).sort({ createdAt: -1 }).limit(50).toArray()
    const carts = await cartRemindersSummary()
    return NextResponse.json({ configured: emailConfigured(), ownerEmail: ownerEmail(), logs, carts, kinds: PREVIEW_KINDS })
  }

  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const to = String(body.to || ownerEmail()).trim()
    if (!to.includes('@')) return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    let mail
    if (body.kind) {
      const m = await buildPreview(body.kind)
      if (!m) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
      mail = { ...m, to, kind: 'test', subject: `[Test] ${m.subject}` }
    } else {
      mail = {
        kind: 'test', to,
        subject: 'Email de test — Atelier JLT',
        text: "Ceci est un email de test : l'envoi des emails de votre boutique fonctionne.",
        html: emailLayout(`<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">Ceci est un email de test : l'envoi des emails de votre boutique fonctionne.</p><p style="font-family:Arial,sans-serif;font-size:13px;color:#777">Envoyé à ${escHtml(to)}</p>`),
      }
    }
    const r = await sendMail(mail)
    return NextResponse.json(r, { status: r.ok ? 200 : 502 })
  }
  return null
}
