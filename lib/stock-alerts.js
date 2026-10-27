// Alertes « retour en stock » — envoi des emails quand un produit revient.
import { availableUnits } from '@/lib/stock'
import { sendMail, emailConfigured } from '@/lib/email'

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * Prévient les personnes inscrites dont la combinaison (couleur/taille) est de
 * nouveau disponible. Retourne { sent, waiting, configured }.
 */
export async function notifyBackInStock(db, product) {
  if (!product) return { sent: 0, waiting: 0, configured: emailConfigured() }
  const pending = await db.collection('stock_alerts').find({ slug: product.slug, notifiedAt: null }).toArray()
  const ready = pending.filter((a) => availableUnits(product, a.variant || null, a.size || null) > 0)
  if (!ready.length || !emailConfigured()) {
    return { sent: 0, waiting: pending.length, ready: ready.length, configured: emailConfigured() }
  }
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const url = `${base}/produit/${encodeURIComponent(product.slug)}`
  let sent = 0
  for (const a of ready) {
    const detail = [a.variant, a.size].filter(Boolean).join(' · ')
    const r = await sendMail({
      kind: 'back_in_stock',
      to: a.email,
      subject: `${product.name} est de retour — Atelier JLT`,
      text: `Bonne nouvelle : ${product.name}${detail ? ` (${detail})` : ''} est de nouveau disponible.\n\nVoir la pièce : ${url}\n\nLes pièces faites main partent vite — à très bientôt,\nAtelier JLT`,
      html: `
      <div style="font-family:Georgia,serif;background:#F6F1EA;padding:32px;color:#211E1A">
        <div style="max-width:520px;margin:0 auto;background:#FFFDF9;padding:32px;border:1px solid #E8DFD2;text-align:center">
          <div style="font-size:26px;color:#0F5C3F;margin-bottom:20px">Atelier JLT</div>
          ${product.images?.[0] && /^https?:/.test(product.images[0]) ? `<img src="${esc(product.images[0])}" alt="" style="width:100%;max-width:360px;margin:0 auto 20px;display:block"/>` : ''}
          <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">Bonne nouvelle : <strong>${esc(product.name)}</strong>${detail ? ` (${esc(detail)})` : ''} est de nouveau disponible.</p>
          <p style="margin:28px 0"><a href="${esc(url)}" style="background:#0F5C3F;color:#fff;text-decoration:none;padding:14px 26px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase">Voir la pièce</a></p>
          <p style="font-family:Arial,sans-serif;font-size:12px;color:#888">Vous recevez ce message car vous avez demandé une alerte de retour en stock.</p>
        </div>
      </div>`,
    })
    if (r.ok) {
      sent++
      await db.collection('stock_alerts').updateOne({ _id: a._id }, { $set: { notifiedAt: new Date().toISOString() } })
    }
  }
  return { sent, waiting: pending.length - sent, ready: ready.length, configured: true }
}
