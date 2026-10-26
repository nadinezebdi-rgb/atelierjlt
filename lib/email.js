// Envoi d'emails transactionnels via la boîte mail OVH (SMTP).
// Variables : SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM (facultatif)
import nodemailer from 'nodemailer'
import { getTrackingUrl, carrierLabel } from '@/lib/tracking'

let transporter = null

export function emailConfigured() {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASSWORD)
}

function getTransporter() {
  if (transporter) return transporter
  const port = Number(process.env.SMTP_PORT || 465)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mail.ovh.net',
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  })
  return transporter
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export async function sendMail({ to, subject, text, html }) {
  if (!emailConfigured()) return { ok: false, error: 'not_configured' }
  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER
    await getTransporter().sendMail({ from: `Atelier JLT <${from}>`, to, subject, text, html })
    return { ok: true }
  } catch (e) {
    console.error('[email] envoi échoué:', e?.code || e?.message)
    return { ok: false, error: 'send_failed' }
  }
}

export async function sendShippedEmail(order) {
  const a = order?.address || {}
  const to = a.email
  if (!to) return { ok: false, error: 'no_email' }
  const name = a.firstName || a.name || ''
  const url = getTrackingUrl(order)
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const accountUrl = base ? `${base}/compte` : ''
  const items = (order.items || []).map((i) => `<li>${esc(i.name)}${i.variant ? ' — ' + esc(i.variant) : ''} × ${esc(i.qty)}</li>`).join('')
  const subject = `Votre commande ${order.orderNumber} est en route`
  const text = [
    `Bonjour ${name},`,
    '',
    `Bonne nouvelle : votre commande ${order.orderNumber} vient d'être expédiée.`,
    order.trackingNumber ? `Transporteur : ${carrierLabel(order.carrier)} — n° de suivi : ${order.trackingNumber}` : '',
    url ? `Suivre mon colis : ${url}` : '',
    accountUrl ? `Votre espace client : ${accountUrl}` : '',
    '',
    'Merci pour votre confiance,',
    'Atelier JLT',
  ].filter((l) => l !== null).join('\n')
  const html = `
  <div style="font-family:Georgia,serif;background:#F6F1EA;padding:32px;color:#211E1A">
    <div style="max-width:520px;margin:0 auto;background:#FFFDF9;padding:32px;border:1px solid #E8DFD2">
      <div style="font-size:26px;color:#0F5C3F;text-align:center;margin-bottom:24px">Atelier JLT</div>
      <p style="font-family:Arial,sans-serif;font-size:15px">Bonjour ${esc(name)},</p>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">Bonne nouvelle : votre commande <strong>${esc(order.orderNumber)}</strong> vient d'être expédiée.</p>
      ${items ? `<ul style="font-family:Arial,sans-serif;font-size:14px;color:#555">${items}</ul>` : ''}
      ${order.trackingNumber ? `<p style="font-family:Arial,sans-serif;font-size:14px">${esc(carrierLabel(order.carrier))} — n° de suivi : <strong>${esc(order.trackingNumber)}</strong></p>` : ''}
      ${url ? `<p style="text-align:center;margin:28px 0"><a href="${esc(url)}" style="background:#0F5C3F;color:#fff;text-decoration:none;padding:14px 26px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">Suivre mon colis</a></p>` : ''}
      ${accountUrl ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#777;text-align:center">Retrouvez le détail dans <a href="${esc(accountUrl)}" style="color:#0F5C3F">votre espace client</a>.</p>` : ''}
      <p style="font-family:Arial,sans-serif;font-size:14px;margin-top:28px">Merci pour votre confiance,<br/>Atelier JLT</p>
    </div>
  </div>`
  return sendMail({ to, subject, text, html })
}
