import { NextResponse } from 'next/server'
import { v4 as uuid } from 'uuid'
import { getDb } from '@/lib/db'
import { PRODUCTS as BASE_PRODUCTS, findProduct as findBaseProduct } from '@/lib/data/products'
import {
  hashPassword, verifyPassword,
  setClientSession, clearClientSession, getClientUserId,
  setAdminSession, clearAdminSession, isAdmin,
} from '@/lib/auth'

// ---- Session cookie (cart, guest) ----
const SID_COOKIE = 'ginette_sid'
function getSid(request) { return request.cookies.get(SID_COOKIE)?.value || null }
function setSidCookie(res, sid) {
  res.cookies.set(SID_COOKIE, sid, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 60,
  })
}

// ---- Merged product catalogue (base + admin overrides + admin-added) ----
async function loadProducts() {
  const db = await getDb()
  const overrides = await db.collection('product_overrides').find({}).toArray()
  const custom = await db.collection('products_custom').find({}).toArray()
  const overrideMap = new Map(overrides.map((o) => [o.slug, o]))
  const merged = BASE_PRODUCTS.map((p) => {
    const o = overrideMap.get(p.slug)
    if (!o) return p
    return { ...p, ...o.data, slug: p.slug, id: p.id }
  })
  // Filter out deleted products
  const deleted = new Set(overrides.filter((o) => o.deleted).map((o) => o.slug))
  const finalBase = merged.filter((p) => !deleted.has(p.slug))
  // Add custom products
  return [...finalBase, ...custom.map((c) => ({ ...c, _custom: true }))]
}
async function findAnyProduct(slug) {
  const all = await loadProducts()
  return all.find((p) => p.slug === slug)
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
  } catch (e) { return [] }
}
async function writeCart(sid, items) {
  const db = await getDb()
  await db.collection('carts').updateOne(
    { _id: sid },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true }
  )
}
function toCartLine(product, qty, variant, size) {
  const variantData = variant && product.variants
    ? product.variants.find((v) => v.name === variant)
    : null
  const sizeData = size && product.sizes
    ? product.sizes.find((s) => s.label === size)
    : null
  // Prix : la taille prime sur le variant qui prime sur le prix produit
  const price = sizeData?.price ?? variantData?.price ?? product.price
  return {
    slug: product.slug, name: product.name, price,
    category: product.category, image: variantData?.image || product.images[0], qty,
    variant: variant || null,
    variantHex: variantData?.hex || null,
    size: size || null,
    sizeDimensions: sizeData?.dimensions || null,
  }
}

// -------------------- MAIN HANDLER --------------------
async function handler(request, { params }) {
  const method = request.method
  const path = (await params).path || []
  const [root, sub, sub2] = path
  const url = new URL(request.url)

  try {
    if (!root) return NextResponse.json({ message: 'Atelier JLT API', ok: true })

    // ============ PRODUCTS ============
    if (root === 'products') {
      const all = await loadProducts()

      if (method === 'GET' && sub) {
        const p = all.find((x) => x.slug === sub)
        if (!p) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const related = all.filter((x) => x.category === p.category && x.slug !== p.slug).slice(0, 4)
        return NextResponse.json({ product: p, related })
      }

      if (method === 'GET') {
        const cat = url.searchParams.get('cat')
        const collection = url.searchParams.get('collection')
        const color = url.searchParams.get('color')
        const min = parseFloat(url.searchParams.get('min') || '0')
        const max = parseFloat(url.searchParams.get('max') || '100000')
        const q = (url.searchParams.get('q') || '').toLowerCase().trim()
        const sort = url.searchParams.get('sort') || 'featured'

        let list = all.slice()
        if (cat) {
          if (cat === 'nouveautes') list = list.filter((p) => p.isNew)
          else if (cat === 'editions-limitees') list = list.filter((p) => p.isLimited)
          else list = list.filter((p) => p.category === cat)
        }
        if (collection) list = list.filter((p) => p.collection === collection)
        if (color) list = list.filter((p) => (p.color || '').toLowerCase().includes(color.toLowerCase()))
        list = list.filter((p) => p.price >= min && p.price <= max)
        if (q) list = list.filter((p) =>
          ((p.name || '') + ' ' + (p.material || '') + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q)
        )
        if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
        else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
        else if (sort === 'new') list.sort((a, b) => Number(b.isNew) - Number(a.isNew))

        return NextResponse.json({ products: list, total: list.length })
      }
    }

    // ============ CART ============
    if (root === 'cart') {
      let sid = getSid(request)
      const body = ['POST', 'PATCH'].includes(method) ? await request.json().catch(() => ({})) : {}

      if (method === 'GET') return NextResponse.json(cartResponse(await readCart(sid)))

      if (method === 'POST') {
        if (!sid) sid = uuid()
        const { slug, qty = 1, variant = null, size = null } = body
        const product = await findAnyProduct(slug)
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
        const items = await readCart(sid)
        // Ligne différenciée par slug + variant + size
        const existing = items.find((i) =>
          i.slug === slug &&
          (i.variant || null) === variant &&
          (i.size || null) === size
        )
        const variantStock = variant && product.variants ? (product.variants.find((v) => v.name === variant)?.stock || 0) : null
        const sizeStock = size && product.sizes ? (product.sizes.find((s) => s.label === size)?.stock || 0) : null
        const maxStock = Math.min(
          variantStock ?? Infinity,
          sizeStock ?? Infinity,
          product.stock || 99
        )
        const cap = Number.isFinite(maxStock) ? maxStock : 99
        if (existing) existing.qty = Math.min(existing.qty + qty, cap || 99)
        else items.push(toCartLine(product, Math.min(qty, cap || 99), variant, size))
        await writeCart(sid, items)
        const res = NextResponse.json(cartResponse(items))
        setSidCookie(res, sid)
        return res
      }

      if (method === 'PATCH') {
        if (!sid) sid = uuid()
        const { slug, qty, variant = null, size = null } = body
        const items = await readCart(sid)
        // Match précis par slug + variant + size si fournis
        let line = items.find((i) =>
          i.slug === slug &&
          (variant === null || (i.variant || null) === variant) &&
          (size === null || (i.size || null) === size)
        )
        // Fallback slug-only : uniquement s'il n'existe qu'une seule ligne pour ce slug
        // (évite de muter par erreur une autre déclinaison)
        if (!line) {
          const matches = items.filter((i) => i.slug === slug)
          if (matches.length === 1) line = matches[0]
        }
        if (line) {
          const p = await findAnyProduct(slug)
          const vStock = line.variant && p?.variants ? (p.variants.find((v) => v.name === line.variant)?.stock || 0) : null
          const sStock = line.size && p?.sizes ? (p.sizes.find((s) => s.label === line.size)?.stock || 0) : null
          const cap = Math.min(vStock ?? Infinity, sStock ?? Infinity, p?.stock || 99)
          const capNum = Number.isFinite(cap) ? cap : 99
          line.qty = Math.max(1, Math.min(qty, capNum || 99))
        }
        await writeCart(sid, items)
        const res = NextResponse.json(cartResponse(items))
        setSidCookie(res, sid)
        return res
      }

      if (method === 'DELETE') {
        if (!sid) return NextResponse.json(cartResponse([]))
        const slug = url.searchParams.get('slug')
        const variant = url.searchParams.get('variant')
        const size = url.searchParams.get('size')
        const items = (await readCart(sid)).filter((i) => {
          if (i.slug !== slug) return true
          if (variant !== null && (i.variant || '') !== (variant || '')) return true
          if (size !== null && (i.size || '') !== (size || '')) return true
          return false
        })
        await writeCart(sid, items)
        return NextResponse.json(cartResponse(items))
      }
    }

    // ============ AUTH ============
    if (root === 'auth') {
      const body = ['POST'].includes(method) ? await request.json().catch(() => ({})) : {}
      const db = await getDb()

      if (sub === 'register' && method === 'POST') {
        const email = (body.email || '').trim().toLowerCase()
        const password = body.password || ''
        const name = (body.name || '').trim()
        if (!email.includes('@') || password.length < 6) {
          return NextResponse.json({ error: 'Email invalide ou mot de passe trop court (min 6)' }, { status: 400 })
        }
        const existing = await db.collection('users').findOne({ email })
        if (existing) return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })
        const passwordHash = await hashPassword(password)
        const id = uuid()
        await db.collection('users').insertOne({
          _id: id, email, name, passwordHash, createdAt: new Date(),
          addresses: [], loyaltyPoints: 0,
        })
        const res = NextResponse.json({ ok: true, user: { id, email, name } })
        setClientSession(res, id)
        return res
      }

      if (sub === 'login' && method === 'POST') {
        const email = (body.email || '').trim().toLowerCase()
        const user = await db.collection('users').findOne({ email })
        if (!user || !(await verifyPassword(body.password || '', user.passwordHash))) {
          return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
        }
        const res = NextResponse.json({ ok: true, user: { id: user._id, email: user.email, name: user.name } })
        setClientSession(res, user._id)
        return res
      }

      if (sub === 'logout' && method === 'POST') {
        const res = NextResponse.json({ ok: true })
        clearClientSession(res)
        return res
      }

      if (sub === 'me' && method === 'GET') {
        const uid = getClientUserId(request)
        if (!uid) return NextResponse.json({ user: null })
        const user = await db.collection('users').findOne({ _id: uid })
        if (!user) return NextResponse.json({ user: null })
        const { passwordHash, ...safe } = user
        return NextResponse.json({ user: { ...safe, id: user._id } })
      }

      // Admin login
      if (sub === 'admin-login' && method === 'POST') {
        if ((body.password || '') !== process.env.ADMIN_PASSWORD) {
          return NextResponse.json({ error: 'Mot de passe admin invalide' }, { status: 401 })
        }
        const res = NextResponse.json({ ok: true })
        setAdminSession(res)
        return res
      }
      if (sub === 'admin-logout' && method === 'POST') {
        const res = NextResponse.json({ ok: true })
        clearAdminSession(res)
        return res
      }
      if (sub === 'admin-status' && method === 'GET') {
        return NextResponse.json({ isAdmin: isAdmin(request) })
      }
    }

    // ============ WISHLIST ============
    if (root === 'wishlist') {
      const uid = getClientUserId(request)
      if (!uid) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })
      const db = await getDb()

      if (method === 'GET') {
        const doc = await db.collection('wishlists').findOne({ _id: uid })
        const slugs = doc?.slugs || []
        const all = await loadProducts()
        const items = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean)
        return NextResponse.json({ items, slugs })
      }

      if (method === 'POST') {
        const { slug } = await request.json()
        await db.collection('wishlists').updateOne(
          { _id: uid },
          { $addToSet: { slugs: slug }, $set: { updatedAt: new Date() } },
          { upsert: true }
        )
        return NextResponse.json({ ok: true })
      }

      if (method === 'DELETE') {
        const slug = url.searchParams.get('slug')
        await db.collection('wishlists').updateOne(
          { _id: uid }, { $pull: { slugs: slug } }
        )
        return NextResponse.json({ ok: true })
      }
    }

    // ============ ORDERS ============
    if (root === 'orders') {
      const uid = getClientUserId(request)
      const db = await getDb()

      if (method === 'GET' && sub) {
        // detail
        const order = await db.collection('orders').findOne({ _id: sub })
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        // client can only see own orders, admin sees all
        if (!isAdmin(request) && order.userId !== uid) {
          return NextResponse.json({ error: 'Interdit' }, { status: 403 })
        }
        return NextResponse.json({ order })
      }

      if (method === 'GET') {
        // list
        if (isAdmin(request)) {
          const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
          return NextResponse.json({ orders })
        }
        if (!uid) return NextResponse.json({ orders: [] })
        const orders = await db.collection('orders').find({ userId: uid }).sort({ createdAt: -1 }).toArray()
        return NextResponse.json({ orders })
      }

      if (method === 'POST') {
        // Create order (checkout — payment simulation for now)
        const sid = getSid(request)
        const items = await readCart(sid)
        if (items.length === 0) return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
        const body = await request.json().catch(() => ({}))
        const { address = {}, couponCode, giftCardCode } = body

        let subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
        let discount = 0
        let couponInfo = null
        if (couponCode) {
          const c = await db.collection('coupons').findOne({ code: couponCode.toUpperCase(), active: true })
          if (c) {
            discount = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value
            couponInfo = { code: c.code, value: discount }
          }
        }
        let giftCredit = 0
        if (giftCardCode) {
          const g = await db.collection('gift_cards').findOne({ code: giftCardCode.toUpperCase() })
          if (g && g.balance > 0) {
            giftCredit = Math.min(g.balance, Math.max(0, subtotal - discount))
            await db.collection('gift_cards').updateOne({ code: g.code }, { $inc: { balance: -giftCredit } })
          }
        }
        const shipping = subtotal >= 150 ? 0 : 8.9
        const total = Math.max(0, subtotal - discount - giftCredit) + shipping

        const orderId = uuid()
        const orderNumber = 'GIN-' + Date.now().toString(36).toUpperCase()
        const order = {
          _id: orderId, orderNumber,
          userId: uid || null,
          items, address,
          subtotal, discount, giftCredit, shipping, total,
          coupon: couponInfo,
          status: 'received', paymentStatus: 'pending',
          createdAt: new Date(),
        }
        await db.collection('orders').insertOne(order)
        // Clear cart
        if (sid) await writeCart(sid, [])
        // Loyalty points (1 point per euro)
        if (uid) await db.collection('users').updateOne({ _id: uid }, { $inc: { loyaltyPoints: Math.round(total) } })
        return NextResponse.json({ ok: true, order })
      }
    }

    // ============ COUPONS (public verify) ============
    if (root === 'coupons' && sub === 'verify' && method === 'POST') {
      const { code } = await request.json().catch(() => ({}))
      const db = await getDb()
      const c = await db.collection('coupons').findOne({ code: (code || '').toUpperCase(), active: true })
      if (!c) return NextResponse.json({ valid: false, error: 'Code invalide' }, { status: 404 })
      return NextResponse.json({ valid: true, code: c.code, type: c.type, value: c.value, label: c.label })
    }

    // ============ GIFT CARDS ============
    if (root === 'gift-cards') {
      const db = await getDb()
      if (sub === 'verify' && method === 'POST') {
        const { code } = await request.json().catch(() => ({}))
        const g = await db.collection('gift_cards').findOne({ code: (code || '').toUpperCase() })
        if (!g) return NextResponse.json({ valid: false }, { status: 404 })
        return NextResponse.json({ valid: true, code: g.code, balance: g.balance })
      }
      if (method === 'POST') {
        // Purchase gift card
        const { amount, recipient = {}, buyerEmail = '' } = await request.json().catch(() => ({}))
        if (![30, 50, 100, 200].includes(amount)) return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
        const code = 'GC-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
        await db.collection('gift_cards').insertOne({
          _id: uuid(), code, initial: amount, balance: amount,
          recipient, buyerEmail, createdAt: new Date(),
        })
        return NextResponse.json({ ok: true, code, amount })
      }
    }

    // ============ ADMIN ============
    if (root === 'admin') {
      if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
      const db = await getDb()

      if (sub === 'stats' && method === 'GET') {
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

      if (sub === 'products') {
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
          // update by slug via ?slug=
          const slug = url.searchParams.get('slug')
          const body = await request.json()
          // Try updating custom first, otherwise store as override
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
      }

      if (sub === 'orders') {
        if (method === 'GET') {
          const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(200).toArray()
          return NextResponse.json({ orders })
        }
        if (method === 'PATCH') {
          const id = url.searchParams.get('id')
          const body = await request.json()
          await db.collection('orders').updateOne({ _id: id }, { $set: body })
          return NextResponse.json({ ok: true })
        }
      }

      if (sub === 'coupons') {
        if (method === 'GET') {
          const items = await db.collection('coupons').find({}).sort({ createdAt: -1 }).toArray()
          return NextResponse.json({ coupons: items })
        }
        if (method === 'POST') {
          const body = await request.json()
          await db.collection('coupons').insertOne({
            _id: uuid(),
            code: (body.code || '').toUpperCase(),
            type: body.type || 'percent', // percent | fixed
            value: Number(body.value) || 0,
            label: body.label || '',
            active: body.active !== false,
            createdAt: new Date(),
          })
          return NextResponse.json({ ok: true })
        }
        if (method === 'DELETE') {
          const id = url.searchParams.get('id')
          await db.collection('coupons').deleteOne({ _id: id })
          return NextResponse.json({ ok: true })
        }
      }

      if (sub === 'newsletters' && method === 'GET') {
        const list = await db.collection('newsletter').find({}).sort({ createdAt: -1 }).limit(500).toArray()
        return NextResponse.json({ list })
      }
      if (sub === 'contacts' && method === 'GET') {
        const list = await db.collection('contacts').find({}).sort({ createdAt: -1 }).limit(500).toArray()
        return NextResponse.json({ list })
      }
      if (sub === 'users' && method === 'GET') {
        const list = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).limit(500).toArray()
        return NextResponse.json({ list })
      }
      if (sub === 'gift-cards' && method === 'GET') {
        const list = await db.collection('gift_cards').find({}).sort({ createdAt: -1 }).toArray()
        return NextResponse.json({ list })
      }

      // === BLOG / JOURNAL — CRUD ===
      if (sub === 'blog') {
        if (method === 'GET') {
          const posts = await db.collection('blog_posts').find({}).sort({ createdAt: -1 }).toArray()
          return NextResponse.json({ posts })
        }
        if (method === 'POST') {
          const body = await request.json()
          const slug = (body.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
          if (!slug) return NextResponse.json({ error: 'Slug invalide' }, { status: 400 })
          // Slug must be unique
          const existing = await db.collection('blog_posts').findOne({ slug })
          if (existing) return NextResponse.json({ error: 'Un article utilise déjà ce slug' }, { status: 409 })
          const now = new Date()
          const post = {
            _id: uuid(),
            slug,
            title: body.title || 'Nouvel article',
            category: body.category || 'Journal',
            excerpt: body.excerpt || '',
            image: body.image || '',
            imageAlt: body.imageAlt || '',
            content: body.content || '',      // Markdown
            keywords: body.keywords || [],
            metaTitle: body.metaTitle || body.title || '',
            metaDescription: body.metaDescription || body.excerpt || '',
            author: body.author || 'Atelier JLT',
            readingTime: body.readingTime || '5 min',
            published: Boolean(body.published),
            publishedAt: body.published ? now : null,
            createdAt: now,
            updatedAt: now,
          }
          await db.collection('blog_posts').insertOne(post)
          return NextResponse.json({ ok: true, post })
        }
        if (method === 'PATCH') {
          const slug = url.searchParams.get('slug')
          const body = await request.json()
          const now = new Date()
          // Si on passe published=true et il n'y a pas encore de date, on la fixe
          const current = await db.collection('blog_posts').findOne({ slug })
          if (!current) return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
          const publishedAt = body.published && !current.publishedAt ? now : current.publishedAt
          const update = { ...body, updatedAt: now, publishedAt }
          delete update._id // sécurité
          delete update.slug // le slug reste stable
          await db.collection('blog_posts').updateOne({ slug }, { $set: update })
          return NextResponse.json({ ok: true })
        }
        if (method === 'DELETE') {
          const slug = url.searchParams.get('slug')
          await db.collection('blog_posts').deleteOne({ slug })
          return NextResponse.json({ ok: true })
        }
      }

      // === CONTENU DU SITE (hero + collections) ===
      if (sub === 'site-content') {
        if (method === 'GET') {
          const doc = await db.collection('site_content').findOne({ _id: 'home' })
          return NextResponse.json({ content: doc?.content || null })
        }
        if (method === 'PATCH' || method === 'POST') {
          const body = await request.json()
          await db.collection('site_content').updateOne(
            { _id: 'home' },
            { $set: { content: body, updatedAt: new Date() } },
            { upsert: true }
          )
          return NextResponse.json({ ok: true })
        }
      }

      // === PARAMÈTRES DU SITE (email, réseaux…) ===
      if (sub === 'settings') {
        if (method === 'GET') {
          const doc = await db.collection('site_settings').findOne({ _id: 'main' })
          return NextResponse.json({ settings: doc?.settings || null })
        }
        if (method === 'PATCH' || method === 'POST') {
          const body = await request.json()
          await db.collection('site_settings').updateOne(
            { _id: 'main' },
            { $set: { settings: body, updatedAt: new Date() } },
            { upsert: true }
          )
          return NextResponse.json({ ok: true })
        }
      }

      // === UPLOAD FICHIER (image, vidéo, PDF — multipart form-data) ===
      if (sub === 'upload' && method === 'POST') {
        try {
          const formData = await request.formData()
          const file = formData.get('file')
          if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
          }
          const fs = await import('node:fs')
          const path = await import('node:path')
          const arrayBuffer = await file.arrayBuffer()
          let buffer = Buffer.from(arrayBuffer)
          const originalSize = buffer.length
          // Extraction extension propre
          const original = file.name || 'upload.bin'
          let rawExt = (original.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '')
          const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp']
          const VIDEO_EXTS = ['mp4', 'webm', 'mov']
          const DOC_EXTS = ['pdf']
          const ALL_EXTS = [...IMAGE_EXTS, ...VIDEO_EXTS, ...DOC_EXTS]
          if (!ALL_EXTS.includes(rawExt)) {
            return NextResponse.json({
              error: `Extension non supportée : .${rawExt}. Autorisés : ${ALL_EXTS.join(', ')}`
            }, { status: 400 })
          }
          // Limite de taille : 50 Mo pour vidéo/PDF, 8 Mo pour image après compression
          const maxBytes = IMAGE_EXTS.includes(rawExt) ? 25 * 1024 * 1024 : 50 * 1024 * 1024
          if (buffer.length > maxBytes) {
            return NextResponse.json({
              error: `Fichier trop volumineux (${(buffer.length / 1024 / 1024).toFixed(1)} Mo, max ${maxBytes / 1024 / 1024} Mo)`
            }, { status: 400 })
          }

          // === COMPRESSION AUTO — images > 2 Mo (jimp, pure JS) ===
          let compressed = false
          let compressedSize = null
          if (IMAGE_EXTS.includes(rawExt) && buffer.length > 2 * 1024 * 1024 && rawExt !== 'webp') {
            try {
              const { Jimp } = await import('jimp')
              const img = await Jimp.read(buffer)
              // Resize à max 2400px sur le plus grand côté
              const w = img.bitmap.width
              const h = img.bitmap.height
              const maxSide = 2400
              if (w > maxSide || h > maxSide) {
                if (w >= h) img.resize({ w: maxSide })
                else img.resize({ h: maxSide })
              }
              // Encode en JPEG qualité 82 (compact)
              const outBuf = await img.getBuffer('image/jpeg', { quality: 82 })
              if (outBuf.length < buffer.length) {
                buffer = outBuf
                rawExt = 'jpg'
                compressed = true
                compressedSize = outBuf.length
              }
            } catch (e) {
              console.warn('compression skipped', e?.message || e)
            }
          }

          const name = 'upload-' + uuid().slice(0, 8) + '.' + rawExt
          const dir = path.join(process.cwd(), 'lib', 'product-images')
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
          fs.writeFileSync(path.join(dir, name), buffer)
          let kind, publicUrl
          if (IMAGE_EXTS.includes(rawExt)) {
            kind = 'image'
            publicUrl = '/api/img/' + name.replace(/\.(jpe?g|webp|png)$/i, '')
          } else if (VIDEO_EXTS.includes(rawExt)) {
            kind = 'video'
            publicUrl = '/api/file/' + name
          } else {
            kind = 'pdf'
            publicUrl = '/api/file/' + name
          }
          return NextResponse.json({
            ok: true,
            url: publicUrl,
            filename: name,
            kind,
            size: buffer.length,
            originalName: original,
            originalSize,
            compressed,
            compressedSize,
          })
        } catch (e) {
          console.error('upload error', e)
          return NextResponse.json({ error: 'Upload failed', details: String(e?.message || e) }, { status: 500 })
        }
      }
    }

    // ============ BLOG / JOURNAL ============
    if (root === 'blog') {
      const db = await getDb()

      // GET /api/blog — liste publique (published only)
      if (method === 'GET' && !sub) {
        const list = await db.collection('blog_posts')
          .find({ published: true })
          .sort({ publishedAt: -1, createdAt: -1 })
          .toArray()
        return NextResponse.json({ posts: list })
      }

      // GET /api/blog/:slug — article public
      if (method === 'GET' && sub) {
        const post = await db.collection('blog_posts').findOne({ slug: sub, published: true })
        if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ post })
      }
    }

    // ============ PUBLIC SITE CONTENT (lecture seule) ============
    if (root === 'site-content' && method === 'GET') {
      const db = await getDb()
      const doc = await db.collection('site_content').findOne({ _id: 'home' })
      return NextResponse.json({ content: doc?.content || null })
    }
    if (root === 'site-settings' && method === 'GET') {
      const db = await getDb()
      const doc = await db.collection('site_settings').findOne({ _id: 'main' })
      return NextResponse.json({ settings: doc?.settings || null })
    }

    // ============ NEWSLETTER ============
    if (root === 'newsletter' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const email = (body.email || '').trim().toLowerCase()
      if (!email || !email.includes('@')) return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
      const db = await getDb()
      await db.collection('newsletter').updateOne(
        { email }, { $set: { email, createdAt: new Date() } }, { upsert: true }
      )
      return NextResponse.json({ ok: true })
    }

    // ============ CONTACT ============
    if (root === 'contact' && method === 'POST') {
      const body = await request.json().catch(() => ({}))
      const { name = '', email = '', message = '' } = body
      if (!email.includes('@') || message.length < 5) {
        return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
      }
      const db = await getDb()
      await db.collection('contacts').insertOne({
        _id: uuid(), name, email, message, createdAt: new Date(),
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
export const PUT = handler
export const DELETE = handler
