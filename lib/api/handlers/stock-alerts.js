// Alertes « retour en stock »
//   POST /api/stock-alerts { slug, variant?, size?, email }  (public)
import { v4 as uuid } from 'uuid'
import { NextResponse, loadProducts } from '../shared'
import { getDb } from '@/lib/db'
import { availableUnits } from '@/lib/stock'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function handle({ request, method }) {
  if (method !== 'POST') return null
  const b = await request.json().catch(() => ({}))
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200)
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
  const all = await loadProducts()
  const p = all.find((x) => x.slug === b.slug)
  if (!p) return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 })
  const variant = b.variant ? String(b.variant).slice(0, 100) : null
  const size = b.size ? String(b.size).slice(0, 100) : null
  if (availableUnits(p, variant, size) > 0) {
    return NextResponse.json({ error: 'Cette pièce est déjà disponible.' }, { status: 409 })
  }
  const db = await getDb()
  const existing = await db.collection('stock_alerts').findOne({ slug: p.slug, variant, size, email, notifiedAt: null })
  if (!existing) {
    await db.collection('stock_alerts').insertOne({
      _id: uuid(), slug: p.slug, productName: p.name, variant, size, email,
      createdAt: new Date().toISOString(), notifiedAt: null,
    })
  }
  return NextResponse.json({ ok: true, already: !!existing })
}
