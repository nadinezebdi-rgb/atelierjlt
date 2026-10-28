// Alertes « retour en stock » — envoi des emails quand un produit revient.
import { availableUnits } from '@/lib/stock'
import { sendMail, emailConfigured, buildBackInStock } from '@/lib/email'


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
  let sent = 0
  for (const a of ready) {
    const detail = [a.variant, a.size].filter(Boolean).join(' · ')
    const r = await sendMail(buildBackInStock({ to: a.email, product, detail }))
    if (r.ok) {
      sent++
      await db.collection('stock_alerts').updateOne({ _id: a._id }, { $set: { notifiedAt: new Date().toISOString() } })
    }
  }
  return { sent, waiting: pending.length - sent, ready: ready.length, configured: true }
}
