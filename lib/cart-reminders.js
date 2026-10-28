// Relance « panier abandonné » pour les clients connectés.
// Relance 1 : 3 h après la dernière modification du panier.
// Relance 2 : 3 jours après la relance 1. Puis plus rien pour ce panier.
// Toute modification du panier (writeCart) remet le compteur à zéro.
import { getDb } from '@/lib/db'
import crypto from 'node:crypto'
import { sendCartReminderEmail, sendGuestCartLinkEmail, emailConfigured } from '@/lib/email'

export const FIRST_DELAY_MS = 3 * 60 * 60 * 1000
export const SECOND_DELAY_MS = 3 * 24 * 60 * 60 * 1000
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // on ne relance pas les paniers de plus de 30 jours
const MAX_ATTEMPTS = 3

function dueFilter(now = Date.now()) {
  return {
    userId: { $exists: true, $ne: null },
    'items.0': { $exists: true },
    updatedAt: { $gte: new Date(now - MAX_AGE_MS) },
    $and: [
      { $or: [{ reminderAttempts: { $exists: false } }, { reminderAttempts: { $lt: MAX_ATTEMPTS } }] },
      { $or: [
        { $and: [{ $or: [{ reminderCount: { $exists: false } }, { reminderCount: 0 }] }, { updatedAt: { $lte: new Date(now - FIRST_DELAY_MS) } }] },
        { reminderCount: 1, lastReminderAt: { $lte: new Date(now - SECOND_DELAY_MS) } },
      ] },
    ],
  }
}

/** Envoie les relances dues. Retourne { sent, failed, skipped, configured }. */
export async function runCartReminders() {
  const db = await getDb()
  if (!emailConfigured()) return { sent: 0, failed: 0, skipped: 0, configured: false }
  const carts = await db.collection('carts').find(dueFilter()).limit(200).toArray()
  let sent = 0, failed = 0, skipped = 0
  for (const c of carts) {
    const prev = c.reminderCount || 0
    const user = await db.collection('users').findOne({ _id: c.userId })
    if (!user?.email || user.cartRemindersOptOut) {
      skipped++
      await db.collection('carts').updateOne({ _id: c._id }, { $set: { reminderCount: 2, reminderSkipped: true } })
      continue
    }
    // Réservation atomique : évite un double envoi si deux passages se chevauchent
    const claim = await db.collection('carts').updateOne(
      { _id: c._id, updatedAt: c.updatedAt, reminderCount: c.reminderCount ?? { $exists: false } },
      { $set: { reminderCount: prev + 1, lastReminderAt: new Date() } }
    )
    if (!claim.modifiedCount) { skipped++; continue }
    const r = await sendCartReminderEmail({ to: user.email, name: user.name, items: c.items, step: prev + 1, userId: user._id })
    if (r.ok) sent++
    else {
      failed++
      await db.collection('carts').updateOne({ _id: c._id }, { $set: { reminderCount: prev, lastReminderAt: c.lastReminderAt || null }, $inc: { reminderAttempts: 1 } })
    }
  }
  const guest = await runGuestCheckoutLinks(db)
  return { sent, failed, skipped, guestSent: guest.sent, guestFailed: guest.failed, configured: true }
}

// Visiteurs qui ont saisi leur e-mail au paiement sans finir : UN seul e-mail avec le lien
// vers leur panier, 3 h après la saisie. Jamais de relance ensuite.
async function runGuestCheckoutLinks(db) {
  const now = Date.now()
  const carts = await db.collection('carts').find({
    guestEmail: { $exists: true, $ne: null },
    guestEmailSource: 'checkout',
    guestLinkSentAt: { $in: [null] },
    'items.0': { $exists: true },
    guestEmailAt: { $lte: new Date(now - FIRST_DELAY_MS), $gte: new Date(now - MAX_AGE_MS) },
    $and: [
      { $or: [{ userId: { $exists: false } }, { userId: null }] },
      { $or: [{ guestAttempts: { $exists: false } }, { guestAttempts: { $lt: MAX_ATTEMPTS } }] },
    ],
  }).limit(200).toArray()
  let sent = 0, failed = 0
  for (const c of carts) {
    const claim = await db.collection('carts').updateOne({ _id: c._id, guestLinkSentAt: { $in: [null] } }, { $set: { guestLinkSentAt: new Date() } })
    if (!claim.modifiedCount) continue
    const token = crypto.randomBytes(24).toString('hex')
    await db.collection('saved_carts').insertOne({
      _id: token, email: c.guestEmail, items: c.items, source: 'checkout', createdAt: new Date(),
      expiresAt: new Date(now + MAX_AGE_MS),
    })
    const r = await sendGuestCartLinkEmail({ to: c.guestEmail, items: c.items, token })
    if (r.ok) sent++
    else {
      failed++
      await db.collection('carts').updateOne({ _id: c._id }, { $set: { guestLinkSentAt: null }, $inc: { guestAttempts: 1 } })
    }
  }
  return { sent, failed }
}

/** Résumé pour l'admin : paniers de clients connectés en cours de relance. */
export async function cartRemindersSummary() {
  const db = await getDb()
  const now = Date.now()
  const carts = await db.collection('carts')
    .find({ userId: { $exists: true, $ne: null }, 'items.0': { $exists: true }, updatedAt: { $gte: new Date(now - MAX_AGE_MS) } })
    .sort({ updatedAt: -1 }).limit(50).toArray()
  const ids = [...new Set(carts.map((c) => c.userId))]
  const users = await db.collection('users').find({ _id: { $in: ids } }, { projection: { email: 1, name: 1, cartRemindersOptOut: 1 } }).toArray()
  const byId = new Map(users.map((u) => [u._id, u]))
  return carts.map((c) => {
    const u = byId.get(c.userId) || {}
    const count = c.reminderCount || 0
    let next = null
    if (!u.cartRemindersOptOut && count === 0) next = new Date(new Date(c.updatedAt).getTime() + FIRST_DELAY_MS)
    if (!u.cartRemindersOptOut && count === 1 && c.lastReminderAt) next = new Date(new Date(c.lastReminderAt).getTime() + SECOND_DELAY_MS)
    return {
      id: c._id,
      email: u.email || null, name: u.name || '',
      optOut: !!u.cartRemindersOptOut,
      itemsCount: (c.items || []).reduce((n, i) => n + (i.qty || 1), 0),
      subtotal: (c.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0),
      updatedAt: c.updatedAt, reminderCount: count, lastReminderAt: c.lastReminderAt || null, nextReminderAt: next,
    }
  })
}
