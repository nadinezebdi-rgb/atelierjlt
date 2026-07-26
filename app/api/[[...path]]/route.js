import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuid } from 'uuid'
import { PRODUCTS, findProduct } from '@/lib/data/products'

// ---- Mongo ----
const uri = process.env.MONGO_URL
const dbName = process.env.DB_NAME || 'ginette'
let cached = global.__ginetteMongo
if (!cached) cached = global.__ginetteMongo = { client: null, db: null }

async function getDb() {
  if (cached.db) return cached.db
  const client = new MongoClient(uri)
  await client.connect()
  cached.client = client
  cached.db = client.db(dbName)
  return cached.db
}

// ---- Session cookie helpers ----
const SID_COOKIE = 'ginette_sid'
function getSid(request) {
  const c = request.cookies.get(SID_COOKIE)
  return c?.value || null
}
function setSidCookie(response, sid) {
  response.cookies.set(SID_COOKIE, sid, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 60,
  })
}

function cartResponse(items = []) {
  return {
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
  }
}

async function readCart(sid) {
  if (!sid) return []
  try {
    const db = await getDb()
    const doc = await db.collection('carts').findOne({ _id: sid })
    return doc?.items || []
  } catch (e) {
    console.error('readCart', e)
    return []
  }
}

async function writeCart(sid, items) {
  const db = await getDb()
  await db.collection('carts').updateOne(
    { _id: sid },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true }
  )
}

function toCartLine(product, qty) {
  return {
    slug: product.slug,
    name: product.name,
    price: product.price,
    category: product.category,
    image: product.images[0],
    qty,
  }
}

// ---- Router ----
async function handler(request, { params }) {
  const method = request.method
  const path = (await params).path || []
  const [root, sub] = path

  try {
    if (!root || root === '') {
      return NextResponse.json({ message: 'Ginette Créations API', ok: true })
    }

    // -------- Products --------
    if (root === 'products') {
      if (method !== 'GET') return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })

      if (sub) {
        const p = findProduct(sub)
        if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const related = PRODUCTS.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4)
        return NextResponse.json({ product: p, related })
      }

      const url = new URL(request.url)
      const cat = url.searchParams.get('cat')
      const collection = url.searchParams.get('collection')
      const color = url.searchParams.get('color')
      const min = parseFloat(url.searchParams.get('min') || '0')
      const max = parseFloat(url.searchParams.get('max') || '100000')
      const q = (url.searchParams.get('q') || '').toLowerCase().trim()
      const sort = url.searchParams.get('sort') || 'featured'

      let list = PRODUCTS.slice()
      if (cat) {
        if (cat === 'nouveautes') list = list.filter((p) => p.isNew)
        else if (cat === 'editions-limitees') list = list.filter((p) => p.isLimited)
        else list = list.filter((p) => p.category === cat)
      }
      if (collection) list = list.filter((p) => p.collection === collection)
      if (color) list = list.filter((p) => p.color.toLowerCase().includes(color.toLowerCase()))
      list = list.filter((p) => p.price >= min && p.price <= max)
      if (q) list = list.filter((p) =>
        (p.name + ' ' + p.material + ' ' + p.tags.join(' ')).toLowerCase().includes(q)
      )
      if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
      else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
      else if (sort === 'new') list.sort((a, b) => Number(b.isNew) - Number(a.isNew))

      return NextResponse.json({ products: list, total: list.length })
    }

    // -------- Cart --------
    if (root === 'cart') {
      let sid = getSid(request)
      const body = ['POST', 'PATCH'].includes(method) ? await request.json().catch(() => ({})) : {}

      if (method === 'GET') {
        const items = await readCart(sid)
        return NextResponse.json(cartResponse(items))
      }

      if (method === 'POST') {
        if (!sid) sid = uuid()
        const { slug, qty = 1 } = body
        const product = findProduct(slug)
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        const items = await readCart(sid)
        const existing = items.find((i) => i.slug === slug)
        if (existing) existing.qty = Math.min(existing.qty + qty, product.stock)
        else items.push(toCartLine(product, Math.min(qty, product.stock)))
        await writeCart(sid, items)
        const res = NextResponse.json(cartResponse(items))
        setSidCookie(res, sid)
        return res
      }

      if (method === 'PATCH') {
        if (!sid) sid = uuid()
        const { slug, qty } = body
        const items = await readCart(sid)
        const line = items.find((i) => i.slug === slug)
        if (line) {
          const p = findProduct(slug)
          line.qty = Math.max(1, Math.min(qty, p?.stock || 99))
        }
        await writeCart(sid, items)
        const res = NextResponse.json(cartResponse(items))
        setSidCookie(res, sid)
        return res
      }

      if (method === 'DELETE') {
        if (!sid) return NextResponse.json(cartResponse([]))
        const url = new URL(request.url)
        const slug = url.searchParams.get('slug')
        const items = (await readCart(sid)).filter((i) => i.slug !== slug)
        await writeCart(sid, items)
        return NextResponse.json(cartResponse(items))
      }
    }

    // -------- Newsletter --------
    if (root === 'newsletter' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = (body.email || '').trim().toLowerCase()
      if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
      const db = await getDb()
      await db.collection('newsletter').updateOne(
        { email },
        { $set: { email, createdAt: new Date() } },
        { upsert: true }
      )
      return NextResponse.json({ ok: true })
    }

    // -------- Contact --------
    if (root === 'contact' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { name = '', email = '', message = '' } = body
      if (!email.includes('@') || message.length < 5) {
        return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
      }
      const db = await getDb()
      await db.collection('contacts').insertOne({
        id: uuid(), name, email, message, createdAt: new Date(),
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (err) {
    console.error('API error', err)
    return NextResponse.json({ error: 'Server error', details: String(err?.message || err) }, { status: 500 })
  }
}

export const GET = handler
export const POST = handler
export const PATCH = handler
export const DELETE = handler
