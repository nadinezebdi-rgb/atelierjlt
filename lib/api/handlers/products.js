import { NextResponse, loadProducts } from '../shared'

export async function handle({ request, method, sub, url }) {
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

  return null
}
