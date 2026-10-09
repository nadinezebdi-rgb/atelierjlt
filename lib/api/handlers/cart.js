import { v4 as uuid } from 'uuid'
import {
  NextResponse, getSid, setSidCookie,
  readCart, writeCart, cartResponse, toCartLine, findAnyProduct,
} from '../shared'

export async function handle({ request, method, url }) {
  let sid = getSid(request)
  const body = ['POST', 'PATCH'].includes(method) ? await request.json().catch(() => ({})) : {}

  if (method === 'GET') return NextResponse.json(cartResponse(await readCart(sid)))

  if (method === 'POST') {
    if (!sid) sid = uuid()
    const { slug, qty = 1, variant = null, size = null } = body
    const product = await findAnyProduct(slug)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    const items = await readCart(sid)
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
    let line = items.find((i) =>
      i.slug === slug &&
      (variant === null || (i.variant || null) === variant) &&
      (size === null || (i.size || null) === size)
    )
    // Fallback slug-only : seulement si une seule ligne pour ce slug
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

  return null
}
