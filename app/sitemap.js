import { PRODUCTS, CATEGORIES } from '@/lib/data/products'

const BASE = 'https://atelierjlt.fr'

export default function sitemap() {
  const now = new Date()
  const staticPages = [
    '',
    '/collections',
    '/a-propos',
    '/journal',
    '/contact',
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

  // La collection Terre a été retirée du site public : on filtre ses produits
  // pour ne pas renvoyer de 404 depuis le sitemap aux moteurs de recherche.
  const productPages = PRODUCTS
    .filter((p) => p.category !== 'terre')
    .map((p) => ({
      url: `${BASE}/produit/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [...staticPages, ...categoryPages, ...productPages]
}
