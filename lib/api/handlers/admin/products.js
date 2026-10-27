import { v4 as uuid } from 'uuid'
import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'
import { notifyBackInStock } from '@/lib/stock-alerts'

export async function handle({ request, method, url }) {
  const db = await getDb()

  if (method === 'GET') {
    const all = await loadProducts()
    return NextResponse.json({ products: all })
  }
  if (method === 'POST' && url.pathname.endsWith('/bulk')) {
    // Modification groupée : { slugs: [...], set: { isNew?: bool, isLimited?: bool } }
    const body = await request.json().catch(() => ({}))
    const slugs = Array.isArray(body.slugs) ? body.slugs.slice(0, 500).map(String) : []
    const set = {}
    for (const k of ['isNew', 'isLimited']) if (typeof body.set?.[k] === 'boolean') set[k] = body.set[k]
    if (!slugs.length || !Object.keys(set).length) return NextResponse.json({ error: 'Rien à modifier' }, { status: 400 })
    const all = await loadProducts()
    let updated = 0
    for (const slug of slugs) {
      const p = all.find((x) => x.slug === slug)
      if (!p) continue
      if (p._custom) {
        await db.collection('products_custom').updateOne({ slug }, { $set: set })
      } else {
        const existing = await db.collection('product_overrides').findOne({ slug })
        const data = { ...(existing?.data || {}), ...set }
        await db.collection('product_overrides').updateOne(
          { slug },
          { $set: { slug, data, deleted: existing?.deleted || false, updatedAt: new Date() } },
          { upsert: true }
        )
      }
      updated++
    }
    return NextResponse.json({ ok: true, updated })
  }
  if (method === 'POST') {
    const body = await request.json()
    const slug = body.slug || ('produit-' + Math.random().toString(36).slice(2, 8))
    const now = new Date()
    await db.collection('products_custom').insertOne({
      _id: uuid(), slug,
      name: body.name || 'Nouvelle création',
      category: body.category || 'decoration',
      collection: body.collection || 'atelier',
      price: Number(body.price) || 0,
      material: body.material || '',
      color: body.color || '',
      style: body.style || '',
      dimensions: body.dimensions || '',
      weight: body.weight || '',
      makingTime: body.makingTime || '',
      stock: Number(body.stock) || 0,
      isNew: Boolean(body.isNew),
      isLimited: Boolean(body.isLimited),
      tags: body.tags || [],
      images: body.images || [],
      story: body.story || '',
      care: body.care || '',
      createdAt: now,
    })
    return NextResponse.json({ ok: true, slug })
  }
  if (method === 'PATCH') {
    const slug = url.searchParams.get('slug')
    const body = await request.json()
    const cust = await db.collection('products_custom').findOne({ slug })
    if (cust) {
      await db.collection('products_custom').updateOne({ slug }, { $set: body })
    } else {
      await db.collection('product_overrides').updateOne(
        { slug },
        { $set: { slug, data: body, deleted: false, updatedAt: new Date() } },
        { upsert: true }
      )
    }
    // Retour en stock → prévient automatiquement les personnes inscrites
    let stockAlerts = null
    try {
      const after = (await loadProducts()).find((p) => p.slug === slug)
      stockAlerts = await notifyBackInStock(db, after)
    } catch (e) {
      console.error('[stock-alerts]', e?.message)
    }
    return NextResponse.json({ ok: true, stockAlerts })
  }
  if (method === 'DELETE') {
    const slug = url.searchParams.get('slug')
    const cust = await db.collection('products_custom').findOne({ slug })
    if (cust) {
      await db.collection('products_custom').deleteOne({ slug })
    } else {
      await db.collection('product_overrides').updateOne(
        { slug }, { $set: { slug, deleted: true, updatedAt: new Date() } }, { upsert: true }
      )
    }
    return NextResponse.json({ ok: true })
  }
  return null
}
