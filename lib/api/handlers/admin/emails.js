import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'
import {
  sendMail, emailConfigured, emailLayout, escHtml, ownerEmail,
  buildOrderConfirmation, buildOwnerNewOrder, buildShipped, buildPasswordReset,
  buildBackInStock, buildWelcome, buildCartReminder, buildGuestCartLink,
} from '@/lib/email'
import { EMAIL_TEXTS, VAR_LABELS, defaultTexts, sanitizeTexts, getEmailTexts } from '@/lib/email-texts'
import { runCartReminders, cartRemindersSummary } from '@/lib/cart-reminders'

export const PREVIEW_KINDS = Object.entries(EMAIL_TEXTS).map(([k, v]) => [k, v.label])

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

async function buildPreview(kind, draft = null) {
  if (!EMAIL_TEXTS[kind]) return null
  const t = await getEmailTexts(kind, draft)
  const { order, items, product } = await sampleData()
  const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
  switch (kind) {
    case 'welcome': return buildWelcome({ to: order.address.email, name: 'Camille' }, t)
    case 'order_confirmation': return buildOrderConfirmation(order, t)
    case 'owner_new_order': return buildOwnerNewOrder(order, t)
    case 'order_shipped': return buildShipped(order, t)
    case 'back_in_stock': return buildBackInStock({ to: order.address.email, product, detail: product.variants?.[0]?.name || '' }, t)
    case 'cart_reminder_1': return buildCartReminder({ to: order.address.email, name: 'Camille', items, step: 1, userId: 'apercu' }, t)
    case 'cart_reminder_2': return buildCartReminder({ to: order.address.email, name: 'Camille', items, step: 2, userId: 'apercu' }, t)
    case 'guest_cart_link': return buildGuestCartLink({ to: order.address.email, items, token: 'apercu' }, t)
    case 'password_reset': return buildPasswordReset({ to: order.address.email, name: 'Camille', link: `${base}/compte/reinitialiser?token=apercu` }, t)
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

  // Aperçu en direct avec des textes non enregistrés
  if (method === 'POST' && sub2 === 'preview') {
    const body = await request.json().catch(() => ({}))
    const mail = await buildPreview(body.kind, body.texts || null)
    if (!mail) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
    return NextResponse.json({ kind: body.kind, subject: mail.subject, html: mail.html, text: mail.text })
  }

  // Textes modifiables
  if (sub2 === 'templates') {
    const kind = method === 'GET' || method === 'DELETE' ? url.searchParams.get('kind') : null
    if (method === 'GET') {
      if (!EMAIL_TEXTS[kind]) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
      const doc = await db.collection('email_templates').findOne({ _id: kind })
      const def = EMAIL_TEXTS[kind]
      return NextResponse.json({
        kind, label: def.label,
        fields: Object.entries(def.fields).map(([key, [label]]) => ({ key, label, multiline: key !== 'subject' && key !== 'button' && key !== 'codeTitle' })),
        vars: def.vars.map((v) => ({ key: v, label: VAR_LABELS[v] || v })),
        defaults: defaultTexts(kind),
        values: { ...defaultTexts(kind), ...(sanitizeTexts(kind, doc?.values || {}) || {}) },
        customized: !!doc && Object.keys(sanitizeTexts(kind, doc.values || {}) || {}).length > 0,
        updatedAt: doc?.updatedAt || null,
      })
    }
    if (method === 'PUT' || method === 'POST') {
      const body = await request.json().catch(() => ({}))
      if (!EMAIL_TEXTS[body.kind]) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
      const clean = sanitizeTexts(body.kind, body.values || {})
      // On ne stocke que ce qui diffère du texte d'origine
      const defs = defaultTexts(body.kind)
      const diff = Object.fromEntries(Object.entries(clean).filter(([k, v]) => v !== defs[k]))
      await db.collection('email_templates').updateOne({ _id: body.kind }, { $set: { values: diff, updatedAt: new Date() } }, { upsert: true })
      return NextResponse.json({ ok: true, customized: Object.keys(diff).length > 0 })
    }
    if (method === 'DELETE') {
      if (!EMAIL_TEXTS[kind]) return NextResponse.json({ error: 'Modèle inconnu' }, { status: 400 })
      await db.collection('email_templates').deleteOne({ _id: kind })
      return NextResponse.json({ ok: true })
    }
  }

  if (method === 'POST' && sub2 === 'run-reminders') {
    const r = await runCartReminders()
    return NextResponse.json({ ok: true, ...r })
  }

  if (method === 'GET') {
    const logs = await db.collection('email_logs').find({}).sort({ createdAt: -1 }).limit(50).toArray()
    const carts = await cartRemindersSummary()
    const customized = (await db.collection('email_templates').find({}).toArray())
      .filter((d) => Object.keys(d.values || {}).length).map((d) => d._id)
    return NextResponse.json({ customized, configured: emailConfigured(), ownerEmail: ownerEmail(), logs, carts, kinds: PREVIEW_KINDS })
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
