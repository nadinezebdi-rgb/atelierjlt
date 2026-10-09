import { v4 as uuid } from 'uuid'
import { NextResponse, loadProducts } from '../../shared'
import { getDb } from '@/lib/db'

export async function handle({ request, method, url }) {
  const db = await getDb()

  if (method === 'GET') {
    const all = await loadProducts()
    return NextResponse.json({ products: all })
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
    return NextResponse.json({ ok: true })
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
