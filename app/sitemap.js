import { PRODUCTS, CATEGORIES } from '@/lib/data/products'

const BASE = 'https://atelierjlt.fr'

export default function sitemap() {
  const now = new Date()
  const staticPages = [
    '',
    '/collections',
    '/atelier',
    '/journal',
    '/contact',
    '/histoire',
  ].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.7,
  }))

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${BASE}/collections?cat=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  const productPages = PRODUCTS.map((p) => ({
    url: `${BASE}/produit/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
