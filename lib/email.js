// Envoi d'emails transactionnels Atelier JLT.
// Transport principal : Resend (RESEND_API_KEY). Repli : SMTP (SMTP_USER / SMTP_PASSWORD).
// Variables facultatives : EMAIL_FROM, EMAIL_REPLY_TO, SHOP_OWNER_EMAIL.
import nodemailer from 'nodemailer'
import { v4 as uuid } from 'uuid'
import { getTrackingUrl, carrierLabel } from '@/lib/tracking'
import { getDb } from '@/lib/db'

const CONTACT = 'contact@atelierjlt.fr'
const replyTo = () => process.env.EMAIL_REPLY_TO || CONTACT
const fromAddr = () => process.env.EMAIL_FROM || `Atelier JLT <${process.env.SMTP_FROM || process.env.SMTP_USER || CONTACT}>`
export const ownerEmail = () => process.env.SHOP_OWNER_EMAIL || CONTACT
const baseUrl = () => (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')

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
function layout(inner) {
  return `
  <div style="font-family:Georgia,serif;background:#F6F1EA;padding:32px;color:#211E1A">
    <div style="max-width:560px;margin:0 auto;background:#FFFDF9;padding:32px;border:1px solid #E8DFD2">
      <div style="font-size:26px;color:#0F5C3F;text-align:center;margin-bottom:24px">Atelier JLT</div>
      ${inner}
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;text-align:center;margin-top:32px;border-top:1px solid #EEE5D8;padding-top:16px">
        Atelier JLT — <a href="mailto:${esc(replyTo())}" style="color:#0F5C3F">${esc(replyTo())}</a>
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

// ---------- 1. Confirmation de commande (client) ----------
export async function sendOrderConfirmationEmail(order) {
  const a = order?.address || {}
  if (!a.email) return { ok: false, error: 'no_email' }
  const name = a.firstName || a.name || ''
  const account = baseUrl() ? `${baseUrl()}/compte` : ''
  const track = baseUrl() ? `${baseUrl()}/suivi` : ''
  const subject = `Merci pour votre commande ${order.orderNumber}`
  const text = [
    `Bonjour ${name},`, '',
    `Merci pour votre commande ${order.orderNumber}. Nous la préparons avec soin dans notre atelier.`, '',
    itemsText(order), '',
    `Sous-total : ${eur(order.subtotal)}`,
    order.discount ? `Réduction : -${eur(order.discount)}` : '',
    order.giftCredit ? `Carte cadeau : -${eur(order.giftCredit)}` : '',
    `Livraison : ${eur(order.shipping)}`,
    `Total : ${eur(order.total)}`, '',
    'Livraison à :', ...addressText(a), '',
    'Vous recevrez un email avec le lien de suivi dès l\'expédition.',
    track ? `Suivre ma commande : ${track}` : '', '',
    'À très bientôt,', 'Atelier JLT',
  ].join('\n')
  const html = layout(`
    ${P(`Bonjour ${esc(name)},`)}
    ${P(`Merci pour votre commande <strong>${esc(order.orderNumber)}</strong>. Nous la préparons avec soin dans notre atelier.`)}
    ${itemsTable(order)}
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#555;line-height:1.6"><strong>Livraison à :</strong><br/>${addressText(a).map(esc).join('<br/>')}</p>
    ${P('Vous recevrez un email avec le lien de suivi dès l\'expédition de votre colis.', 'color:#555;font-size:14px')}
    ${track ? BTN(track, 'Suivre ma commande') : ''}
    ${account ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#777;text-align:center">Retrouvez le détail dans <a href="${esc(account)}" style="color:#0F5C3F">votre espace client</a>.</p>` : ''}
    ${P('À très bientôt,<br/>Atelier JLT', 'margin-top:28px;font-size:14px')}`)
  return sendMail({ to: a.email, subject, text, html, kind: 'order_confirmation' })
}

// ---------- 2. Nouvelle commande (propriétaire) ----------
export async function sendOwnerNewOrderEmail(order) {
  const a = order?.address || {}
  const admin = baseUrl() ? `${baseUrl()}/admin` : ''
  const subject = `Nouvelle commande ${order.orderNumber} — ${eur(order.total)}`
  const text = [
    `Nouvelle commande ${order.orderNumber}`, '',
    `Client : ${a.name || ''} <${a.email || ''}>`, ...addressText(a), '',
    itemsText(order), '',
    `Livraison : ${a.shippingMethod === 'express' ? 'Express' : 'Standard'} (${eur(order.shipping)})`,
    `Total : ${eur(order.total)}`,
    admin ? `\nOuvrir l'admin : ${admin}` : '',
  ].join('\n')
  const html = layout(`
    ${P(`Nouvelle commande <strong>${esc(order.orderNumber)}</strong>`)}
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#555;line-height:1.6"><strong>${esc(a.name || '')}</strong> — <a href="mailto:${esc(a.email || '')}" style="color:#0F5C3F">${esc(a.email || '')}</a><br/>${addressText(a).slice(1).map(esc).join('<br/>')}</p>
    ${itemsTable(order)}
    ${admin ? BTN(admin, 'Ouvrir l\'admin') : ''}`)
  return sendMail({ to: ownerEmail(), subject, text, html, kind: 'owner_new_order' })
}

// ---------- 3. Commande expédiée + suivi ----------
export async function sendShippedEmail(order) {
  const a = order?.address || {}
  const to = a.email
  if (!to) return { ok: false, error: 'no_email' }
  const name = a.firstName || a.name || ''
  const url = getTrackingUrl(order)
  const accountUrl = baseUrl() ? `${baseUrl()}/compte` : ''
  const items = (order.items || []).map((i) => `<li>${esc(i.name)}${i.variant ? ' — ' + esc(i.variant) : ''} × ${esc(i.qty)}</li>`).join('')
  const subject = `Votre commande ${order.orderNumber} est en route`
  const text = [
    `Bonjour ${name},`, '',
    `Bonne nouvelle : votre commande ${order.orderNumber} vient d'être expédiée.`,
    order.trackingNumber ? `Transporteur : ${carrierLabel(order.carrier)} — n° de suivi : ${order.trackingNumber}` : '',
    url ? `Suivre mon colis : ${url}` : '',
    accountUrl ? `Votre espace client : ${accountUrl}` : '', '',
    'Merci pour votre confiance,', 'Atelier JLT',
  ].join('\n')
  const html = layout(`
    ${P(`Bonjour ${esc(name)},`)}
    ${P(`Bonne nouvelle : votre commande <strong>${esc(order.orderNumber)}</strong> vient d'être expédiée.`)}
    ${items ? `<ul style="font-family:Arial,sans-serif;font-size:14px;color:#555">${items}</ul>` : ''}
    ${order.trackingNumber ? P(`${esc(carrierLabel(order.carrier))} — n° de suivi : <strong>${esc(order.trackingNumber)}</strong>`, 'font-size:14px') : ''}
    ${url ? BTN(url, 'Suivre mon colis') : ''}
    ${accountUrl ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#777;text-align:center">Retrouvez le détail dans <a href="${esc(accountUrl)}" style="color:#0F5C3F">votre espace client</a>.</p>` : ''}
    ${P('Merci pour votre confiance,<br/>Atelier JLT', 'margin-top:28px;font-size:14px')}`)
  return sendMail({ to, subject, text, html, kind: 'order_shipped' })
}

// ---------- 4. Mot de passe oublié ----------
export async function sendPasswordResetEmail({ to, name, link }) {
  const subject = 'Réinitialisation de votre mot de passe — Atelier JLT'
  const text = [
    `Bonjour ${name || ''},`, '',
    'Vous avez demandé à réinitialiser votre mot de passe. Ce lien est valable 1 heure :',
    link, '',
    'Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet email.', '',
    'Atelier JLT',
  ].join('\n')
  const html = layout(`
    ${P(`Bonjour ${esc(name || '')},`)}
    ${P('Vous avez demandé à réinitialiser votre mot de passe. Cliquez ci-dessous pour en choisir un nouveau — ce lien est valable 1 heure.')}
    ${BTN(link, 'Choisir un nouveau mot de passe')}
    ${P('Si vous n\'êtes pas à l\'origine de cette demande, ignorez simplement cet email : votre mot de passe actuel reste inchangé.', 'font-size:13px;color:#777')}`)
  return sendMail({ to, subject, text, html, kind: 'password_reset' })
}

export { layout as emailLayout, esc as escHtml }
