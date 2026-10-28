// Envoi d'emails transactionnels Atelier JLT.
// Transport principal : Resend (RESEND_API_KEY). Repli : SMTP (SMTP_USER / SMTP_PASSWORD).
// Variables facultatives : EMAIL_FROM, EMAIL_REPLY_TO, SHOP_OWNER_EMAIL.
//
// Chaque modèle a un « build* » (sujet + texte + HTML, réutilisé par l'aperçu admin)
// et un « send* » qui l'envoie.
import crypto from 'node:crypto'
import nodemailer from 'nodemailer'
import { v4 as uuid } from 'uuid'
import { getTrackingUrl, carrierLabel } from '@/lib/tracking'
import { getDb } from '@/lib/db'
import { defaultTexts, getEmailTexts, fill } from '@/lib/email-texts'

const CONTACT = 'contact@atelierjlt.fr'
const replyTo = () => process.env.EMAIL_REPLY_TO || CONTACT
const fromAddr = () => process.env.EMAIL_FROM || `Atelier JLT <${process.env.SMTP_FROM || process.env.SMTP_USER || CONTACT}>`
export const ownerEmail = () => process.env.SHOP_OWNER_EMAIL || CONTACT
const baseUrl = () => (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
export const WELCOME_CODE = 'BIENVENUE10'

function provider() {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) return 'smtp'
  return null
}
export function emailConfigured() { return !!provider() }

let transporter = null
function getTransporter() {
  if (transporter) return transporter
  const port = Number(process.env.SMTP_PORT || 465)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mail.ovh.net',
    port, secure: port === 465, requireTLS: port === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })
  return transporter
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`
const absImg = (src) => {
  if (!src) return ''
  if (/^https?:/.test(src)) return src
  return src.startsWith('/') && baseUrl() ? baseUrl() + src : ''
}

async function logEmail(entry) {
  try {
    const db = await getDb()
    await db.collection('email_logs').insertOne({ _id: uuid(), createdAt: new Date(), ...entry })
  } catch {}
}

/** Envoi générique. Ne lève jamais d'exception : retourne { ok, error?, id? }. */
export async function sendMail({ to, subject, text, html, kind = 'generic' }) {
  const p = provider()
  if (!p) { await logEmail({ kind, to, subject, status: 'not_configured' }); return { ok: false, error: 'not_configured' } }
  try {
    let id = null
    if (p === 'resend') {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: fromAddr(), to: Array.isArray(to) ? to : [to], reply_to: replyTo(), subject, text, html }),
        signal: AbortSignal.timeout(15000),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`)
      id = d?.id || null
    } else {
      const info = await getTransporter().sendMail({ from: fromAddr(), replyTo: replyTo(), to, subject, text, html })
      id = info?.messageId || null
    }
    await logEmail({ kind, to, subject, status: 'sent', provider: p, providerId: id })
    return { ok: true, id }
  } catch (e) {
    console.error('[email] envoi échoué:', kind, e?.code || e?.message)
    await logEmail({ kind, to, subject, status: 'failed', provider: p, error: String(e?.message || e).slice(0, 300) })
    return { ok: false, error: 'send_failed', detail: String(e?.message || '').slice(0, 200) }
  }
}

// ---------- Mise en page commune ----------
function layout(inner, footerExtra = '') {
  return `
  <div style="font-family:Georgia,serif;background:#F6F1EA;padding:32px;color:#211E1A">
    <div style="max-width:560px;margin:0 auto;background:#FFFDF9;padding:32px;border:1px solid #E8DFD2">
      <div style="font-size:26px;color:#0F5C3F;text-align:center;margin-bottom:24px">Atelier JLT</div>
      ${inner}
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;text-align:center;margin-top:32px;border-top:1px solid #EEE5D8;padding-top:16px">
        Atelier JLT — <a href="mailto:${esc(replyTo())}" style="color:#0F5C3F">${esc(replyTo())}</a>
        ${footerExtra}
      </p>
    </div>
  </div>`
}
const P = (html, extra = '') => `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;${extra}">${html}</p>`
const BTN = (url, label) => `<p style="text-align:center;margin:28px 0"><a href="${esc(url)}" style="background:#0F5C3F;color:#fff;text-decoration:none;padding:14px 26px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">${esc(label)}</a></p>`

function itemsTable(order) {
  const rows = (order.items || []).map((i) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #EEE5D8">${esc(i.name)}${i.variant ? ` <span style="color:#888">— ${esc(i.variant)}</span>` : ''}${i.size ? ` <span style="color:#888">· ${esc(i.size)}</span>` : ''} × ${esc(i.qty)}</td>
      <td style="padding:8px 0;border-bottom:1px solid #EEE5D8;text-align:right;white-space:nowrap">${eur((i.price || 0) * (i.qty || 1))}</td>
    </tr>`).join('')
  const line = (label, val, bold) => `<tr><td style="padding:4px 0;${bold ? 'font-weight:bold' : 'color:#555'}">${label}</td><td style="padding:4px 0;text-align:right;${bold ? 'font-weight:bold' : 'color:#555'}">${val}</td></tr>`
  return `
  <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin:16px 0">
    ${rows}
    ${line('Sous-total', eur(order.subtotal))}
    ${order.discount ? line(`Réduction${order.coupon?.code ? ` (${esc(order.coupon.code)})` : ''}`, '− ' + eur(order.discount)) : ''}
    ${order.giftCredit ? line('Carte cadeau', '− ' + eur(order.giftCredit)) : ''}
    ${line(`Livraison ${order.address?.shippingMethod === 'express' ? 'express' : 'standard'}`, eur(order.shipping))}
    ${line('Total', eur(order.total), true)}
  </table>`
}
function itemsText(order) {
  return (order.items || []).map((i) => `- ${i.name}${i.variant ? ' — ' + i.variant : ''}${i.size ? ' · ' + i.size : ''} × ${i.qty} : ${eur((i.price || 0) * (i.qty || 1))}`).join('\n')
}
function addressText(a = {}) {
  return [a.name || `${a.firstName || ''} ${a.lastName || ''}`.trim(), a.address, a.apt, `${a.zip || ''} ${a.city || ''}`.trim(), a.country, a.phone].filter(Boolean)
}

// ---------- Textes modifiables ----------
// h(t,'intro',vars) → HTML échappé (retours à la ligne conservés) ; s(...) → texte brut
const s = (t, key, vars) => fill(t?.[key], vars)
const h = (t, key, vars) => esc(fill(t?.[key], vars)).replace(/\n/g, '<br/>')
const hello = (name) => `Bonjour${name ? ' ' + name : ''},`

// ---------- 1. Confirmation de commande (client) ----------
export function buildOrderConfirmation(order, t = defaultTexts('order_confirmation')) {
  const a = order?.address || {}
  const name = a.firstName || a.name || ''
  const vars = { prenom: name, commande: order.orderNumber, total: eur(order.total) }
  const account = baseUrl() ? `${baseUrl()}/compte` : ''
  const track = baseUrl() ? `${baseUrl()}/suivi` : ''
  const text = [
    hello(name), '',
    s(t, 'intro', vars), '',
    itemsText(order), '',
    `Sous-total : ${eur(order.subtotal)}`,
    order.discount ? `Réduction : -${eur(order.discount)}` : '',
    order.giftCredit ? `Carte cadeau : -${eur(order.giftCredit)}` : '',
    `Livraison : ${eur(order.shipping)}`,
    `Total : ${eur(order.total)}`, '',
    'Livraison à :', ...addressText(a), '',
    s(t, 'note', vars),
    track ? `${s(t, 'button', vars)} : ${track}` : '', '',
    s(t, 'outro', vars),
  ].join('\n')
  const html = layout(`
    ${P(esc(hello(name)))}
    ${P(h(t, 'intro', vars))}
    ${itemsTable(order)}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;line-height:1.6"><strong>Livraison à :</strong><br/>${addressText(a).map(esc).join('<br/>')}</p>
    ${t.note ? P(h(t, 'note', vars), 'color:#555;font-size:14px') : ''}
    ${track ? BTN(track, s(t, 'button', vars)) : ''}
    ${account ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#777;text-align:center">Retrouvez le détail dans <a href="${esc(account)}" style="color:#0F5C3F">votre espace client</a>.</p>` : ''}
    ${P(h(t, 'outro', vars), 'margin-top:28px;font-size:14px')}`)
  return { kind: 'order_confirmation', to: a.email, subject: s(t, 'subject', vars), text, html }
}
export async function sendOrderConfirmationEmail(order) {
  if (!order?.address?.email) return { ok: false, error: 'no_email' }
  return sendMail(buildOrderConfirmation(order, await getEmailTexts('order_confirmation')))
}

// ---------- 2. Nouvelle commande (propriétaire) ----------
export function buildOwnerNewOrder(order, t = defaultTexts('owner_new_order')) {
  const a = order?.address || {}
  const vars = { commande: order.orderNumber, total: eur(order.total), client: a.name || '' }
  const admin = baseUrl() ? `${baseUrl()}/admin` : ''
  const text = [
    s(t, 'intro', vars), '',
    `Client : ${a.name || ''} <${a.email || ''}>`, ...addressText(a), '',
    itemsText(order), '',
    `Livraison : ${a.shippingMethod === 'express' ? 'Express' : 'Standard'} (${eur(order.shipping)})`,
    `Total : ${eur(order.total)}`,
    admin ? `\n${s(t, 'button', vars)} : ${admin}` : '',
  ].join('\n')
  const html = layout(`
    ${P(`<strong>${h(t, 'intro', vars)}</strong>`)}
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6"><strong>${esc(a.name || '')}</strong> — <a href="mailto:${esc(a.email || '')}" style="color:#0F5C3F">${esc(a.email || '')}</a><br/>${addressText(a).slice(1).map(esc).join('<br/>')}</p>
    ${itemsTable(order)}
    ${admin ? BTN(admin, s(t, 'button', vars)) : ''}`)
  return { kind: 'owner_new_order', to: ownerEmail(), subject: s(t, 'subject', vars), text, html }
}
export async function sendOwnerNewOrderEmail(order) {
  return sendMail(buildOwnerNewOrder(order, await getEmailTexts('owner_new_order')))
}

// ---------- 3. Commande expédiée + suivi ----------
export function buildShipped(order, t = defaultTexts('order_shipped')) {
  const a = order?.address || {}
  const name = a.firstName || a.name || ''
  const vars = { prenom: name, commande: order.orderNumber, transporteur: carrierLabel(order.carrier), suivi: order.trackingNumber || '' }
  const url = getTrackingUrl(order)
  const accountUrl = baseUrl() ? `${baseUrl()}/compte` : ''
  const items = (order.items || []).map((i) => `<li>${esc(i.name)}${i.variant ? ' — ' + esc(i.variant) : ''} × ${esc(i.qty)}</li>`).join('')
  const text = [
    hello(name), '',
    s(t, 'intro', vars),
    order.trackingNumber ? `Transporteur : ${carrierLabel(order.carrier)} — n° de suivi : ${order.trackingNumber}` : '',
    url ? `${s(t, 'button', vars)} : ${url}` : '',
    accountUrl ? `Votre espace client : ${accountUrl}` : '', '',
    s(t, 'outro', vars),
  ].join('\n')
  const html = layout(`
    ${P(esc(hello(name)))}
    ${P(h(t, 'intro', vars))}
    ${items ? `<ul style="font-family:Arial,sans-serif;font-size:14px;color:#555">${items}</ul>` : ''}
    ${order.trackingNumber ? P(`${esc(carrierLabel(order.carrier))} — n° de suivi : <strong>${esc(order.trackingNumber)}</strong>`, 'font-size:14px') : ''}
    ${url ? BTN(url, s(t, 'button', vars)) : ''}
    ${accountUrl ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#777;text-align:center">Retrouvez le détail dans <a href="${esc(accountUrl)}" style="color:#0F5C3F">votre espace client</a>.</p>` : ''}
    ${P(h(t, 'outro', vars), 'margin-top:28px;font-size:14px')}`)
  return { kind: 'order_shipped', to: a.email, subject: s(t, 'subject', vars), text, html }
}
export async function sendShippedEmail(order) {
  if (!order?.address?.email) return { ok: false, error: 'no_email' }
  return sendMail(buildShipped(order, await getEmailTexts('order_shipped')))
}

// ---------- 4. Mot de passe oublié ----------
export function buildPasswordReset({ to, name, link }, t = defaultTexts('password_reset')) {
  const vars = { prenom: name || '' }
  const text = [hello(name), '', s(t, 'intro', vars), link, '', s(t, 'outro', vars), '', 'Atelier JLT'].join('\n')
  const html = layout(`
    ${P(esc(hello(name)))}
    ${P(h(t, 'intro', vars))}
    ${BTN(link, s(t, 'button', vars))}
    ${P(h(t, 'outro', vars), 'font-size:13px;color:#777')}`)
  return { kind: 'password_reset', to, subject: s(t, 'subject', vars), text, html }
}
export async function sendPasswordResetEmail(args) {
  return sendMail(buildPasswordReset(args, await getEmailTexts('password_reset')))
}

// ---------- 5. Retour en stock ----------
export function buildBackInStock({ to, product, detail }, t = defaultTexts('back_in_stock')) {
  const vars = { produit: product.name, detail: detail ? `(${detail})` : '' }
  const url = `${baseUrl()}/produit/${encodeURIComponent(product.slug)}`
  const img = absImg(product.images?.[0])
  const text = `${s(t, 'intro', vars)}\n\n${s(t, 'button', vars)} : ${url}\n\n${s(t, 'outro', vars)}`
  const html = layout(`
    <div style="text-align:center">
      ${img ? `<img src="${esc(img)}" alt="" style="width:100%;max-width:360px;margin:0 auto 20px;display:block"/>` : ''}
      ${P(h(t, 'intro', vars))}
      ${BTN(url, s(t, 'button', vars))}
      ${P(h(t, 'outro', vars), 'font-size:14px')}
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Vous recevez ce message car vous avez demandé une alerte de retour en stock.</p>
    </div>`)
  return { kind: 'back_in_stock', to, subject: s(t, 'subject', vars), text, html }
}
export async function sendBackInStockEmail(args) {
  return sendMail(buildBackInStock(args, await getEmailTexts('back_in_stock')))
}

// ---------- 6. Bienvenue (création de compte) ----------
export function buildWelcome({ to, name, code = WELCOME_CODE }, t = defaultTexts('welcome')) {
  const vars = { prenom: name || '', code: code || '' }
  const shop = baseUrl() ? `${baseUrl()}/collections` : ''
  const text = [
    hello(name), '',
    s(t, 'intro', vars), '',
    code ? `${s(t, 'codeTitle', vars)} : ${code} — ${s(t, 'codeText', vars)}` : '', '',
    shop ? `${s(t, 'button', vars)} : ${shop}` : '', '',
    s(t, 'outro', vars),
  ].join('\n')
  const html = layout(`
    ${P(esc(hello(name)))}
    ${P(h(t, 'intro', vars))}
    ${code ? `
    <div style="text-align:center;margin:28px 0;padding:22px;border:1px dashed #0F5C3F;background:#F6F1EA">
      <div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#777">${h(t, 'codeTitle', vars)}</div>
      <div style="font-size:30px;color:#0F5C3F;margin:8px 0;letter-spacing:3px">${esc(code)}</div>
      <div style="font-family:Arial,sans-serif;font-size:14px;color:#555">${h(t, 'codeText', vars)}</div>
    </div>` : ''}
    ${shop ? BTN(shop, s(t, 'button', vars)) : ''}
    ${P(h(t, 'outro', vars), 'margin-top:28px;font-size:14px')}`)
  return { kind: 'welcome', to, subject: s(t, 'subject', vars), text, html }
}
export async function sendWelcomeEmail({ to, name }) {
  // N'affiche le code que s'il est toujours actif dans l'admin
  let code = WELCOME_CODE
  try {
    const db = await getDb()
    const c = await db.collection('coupons').findOne({ code: WELCOME_CODE, active: true })
    if (!c) code = null
  } catch {}
  return sendMail(buildWelcome({ to, name, code }, await getEmailTexts('welcome')))
}

// ---------- 7. Panier (relances client + lien visiteur) ----------
export function unsubscribeToken(userId) {
  return crypto.createHmac('sha256', process.env.JWT_SECRET || 'atelier-jlt').update(`cart-reminders:${userId}`).digest('hex').slice(0, 32)
}
export function unsubscribeUrl(userId) {
  return `${baseUrl()}/api/emails/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`
}

function cartItemsHtml(items) {
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0)
  const rows = items.map((i) => {
    const img = absImg(i.image)
    const sub = [i.variant, i.size].filter(Boolean).map(esc).join(' · ')
    return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEE5D8;width:72px">${img ? `<img src="${esc(img)}" alt="" width="64" height="64" style="width:64px;height:64px;object-fit:cover;display:block"/>` : ''}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #EEE5D8">${esc(i.name)}${sub ? `<br/><span style="color:#888;font-size:12px">${sub}</span>` : ''}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEE5D8;text-align:right;white-space:nowrap">× ${esc(i.qty)} · ${eur((i.price || 0) * (i.qty || 1))}</td>
    </tr>`
  }).join('')
  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;margin:16px 0">
      ${rows}
      <tr><td></td><td style="padding:10px 12px;font-weight:bold">Sous-total</td><td style="padding:10px 0;text-align:right;font-weight:bold">${eur(subtotal)}</td></tr>
    </table>`
}
function cartItemsText(items) {
  const subtotal = items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0)
  return [
    ...items.map((i) => `- ${i.name}${i.variant ? ' — ' + i.variant : ''}${i.size ? ' · ' + i.size : ''} × ${i.qty} : ${eur((i.price || 0) * (i.qty || 1))}`),
    '', `Sous-total : ${eur(subtotal)}`,
  ].join('\n')
}

export function buildCartReminder({ to, name, items = [], step = 1, userId = 'demo' }, t = defaultTexts(step === 1 ? 'cart_reminder_1' : 'cart_reminder_2')) {
  const vars = { prenom: name || '' }
  const cart = baseUrl() ? `${baseUrl()}/checkout` : ''
  const unsub = unsubscribeUrl(userId)
  const text = [
    hello(name), '', s(t, 'intro', vars), '',
    cartItemsText(items), '',
    cart ? `${s(t, 'button', vars)} : ${cart}` : '', '',
    s(t, 'outro', vars), '',
    `Ne plus recevoir ces rappels : ${unsub}`,
  ].join('\n')
  const html = layout(`
    ${P(esc(hello(name)))}
    ${P(h(t, 'intro', vars))}
    ${cartItemsHtml(items)}
    ${cart ? BTN(cart, s(t, 'button', vars)) : ''}
    ${P(h(t, 'outro', vars), 'margin-top:28px;font-size:14px')}`,
    `<br/><a href="${esc(unsub)}" style="color:#999">Ne plus recevoir ces rappels</a>`)
  return { kind: step === 1 ? 'cart_reminder_1' : 'cart_reminder_2', to, subject: s(t, 'subject', vars), text, html }
}
export async function sendCartReminderEmail(args) {
  return sendMail(buildCartReminder(args, await getEmailTexts(args.step === 1 ? 'cart_reminder_1' : 'cart_reminder_2')))
}

export function restoreUrl(token) {
  return `${baseUrl()}/api/cart/restore?t=${encodeURIComponent(token)}`
}
export function buildGuestCartLink({ to, items = [], token = 'apercu' }, t = defaultTexts('guest_cart_link')) {
  const link = restoreUrl(token)
  const text = [
    'Bonjour,', '', s(t, 'intro'), '',
    cartItemsText(items), '',
    `${s(t, 'button')} : ${link}`, '',
    s(t, 'outro'), '',
    'Vous recevez ce message car vous avez demandé à recevoir votre panier par e-mail. Vous ne recevrez pas d’autre message.',
  ].join('\n')
  const html = layout(`
    ${P('Bonjour,')}
    ${P(h(t, 'intro'))}
    ${cartItemsHtml(items)}
    ${BTN(link, s(t, 'button'))}
    ${P(h(t, 'outro'), 'margin-top:28px;font-size:14px')}
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#888;text-align:center">Vous recevez ce message car vous avez demandé à recevoir votre panier par e-mail. Vous ne recevrez pas d’autre message.</p>`)
  return { kind: 'guest_cart_link', to, subject: s(t, 'subject'), text, html }
}
export async function sendGuestCartLinkEmail(args) {
  return sendMail(buildGuestCartLink(args, await getEmailTexts('guest_cart_link')))
}

export { layout as emailLayout, esc as escHtml }
