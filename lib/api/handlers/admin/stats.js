import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'

// Seules les commandes réellement payées comptent dans le chiffre d'affaires.
// (Les commandes passées avant le branchement du paiement sont des essais.)
const PAID = { paymentStatus: 'paid' }
const UNPAID = { paymentStatus: { $ne: 'paid' } }

// GET  /api/admin/stats
// POST /api/admin/stats/archive-unpaid → déplace les commandes non payées dans orders_archive
export async function handle({ method, sub2 }) {
  const db = await getDb()
  if (method === 'POST' && sub2 === 'archive-unpaid') {
    const docs = await db.collection('orders').find(UNPAID).toArray()
    if (docs.length) {
      const now = new Date()
      await db.collection('orders_archive').insertMany(docs.map((d) => ({ ...d, archivedAt: now, archivedReason: 'commande d’essai non payée' })), { ordered: false }).catch(() => {})
      await db.collection('orders').deleteMany({ _id: { $in: docs.map((d) => d._id) } })
    }
    return NextResponse.json({ ok: true, archived: docs.length })
  }
  if (method !== 'GET') return null
  const [orderCount, unpaidCount, userCount, revenue, newsletterCount] = await Promise.all([
    db.collection('orders').countDocuments(PAID),
    db.collection('orders').countDocuments(UNPAID),
    db.collection('users').countDocuments(),
    db.collection('orders').aggregate([{ $match: PAID }, { $group: { _id: null, sum: { $sum: '$total' } } }]).toArray(),
    db.collection('newsletter').countDocuments(),
  ])
  const products = await loadProducts()
  return NextResponse.json({
    orderCount, unpaidCount, userCount,
    revenue: revenue[0]?.sum || 0,
    newsletterCount, productCount: products.length,
  })
}
