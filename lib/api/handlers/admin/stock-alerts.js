// Admin — alertes retour en stock
//   GET    /api/admin/stock-alerts                 → { alerts, summary:[{slug,name,count}], emailConfigured }
//   POST   /api/admin/stock-alerts/notify?slug=x   → envoie maintenant aux inscrits dont l'article est dispo
//   DELETE /api/admin/stock-alerts?id=x            → supprime une inscription
import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'
import { notifyBackInStock } from '@/lib/stock-alerts'
import { emailConfigured } from '@/lib/email'

export async function handle({ method, url, sub2 }) {
  const db = await getDb()
  if (method === 'GET') {
    const alerts = await db.collection('stock_alerts').find({ notifiedAt: null }).sort({ createdAt: -1 }).limit(500).toArray()
    const map = new Map()
    for (const a of alerts) {
      const m = map.get(a.slug) || { slug: a.slug, name: a.productName || a.slug, count: 0 }
      m.count++
      map.set(a.slug, m)
    }
    return NextResponse.json({ alerts, summary: [...map.values()], emailConfigured: emailConfigured() })
  }
  if (method === 'POST' && sub2 === 'notify') {
    const slug = url.searchParams.get('slug')
    const p = (await loadProducts()).find((x) => x.slug === slug)
    if (!p) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
    return NextResponse.json({ ok: true, ...(await notifyBackInStock(db, p)) })
  }
  if (method === 'DELETE') {
    await db.collection('stock_alerts').deleteOne({ _id: url.searchParams.get('id') })
    return NextResponse.json({ ok: true })
  }
  return null
}
