import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'

export async function handle({ method }) {
  if (method !== 'GET') return null
  const db = await getDb()
  const [orderCount, userCount, revenue, newsletterCount] = await Promise.all([
    db.collection('orders').countDocuments(),
    db.collection('users').countDocuments(),
    db.collection('orders').aggregate([{ $group: { _id: null, sum: { $sum: '$total' } } }]).toArray(),
    db.collection('newsletter').countDocuments(),
  ])
  const products = await loadProducts()
  return NextResponse.json({
    orderCount, userCount,
    revenue: revenue[0]?.sum || 0,
    newsletterCount, productCount: products.length,
  })
}
