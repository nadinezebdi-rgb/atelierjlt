import { PRODUCTS, CATEGORIES } from '@/lib/data/products'

const BASE = 'https://atelierjlt.fr'

export default function sitemap() {
  const now = new Date()
  const staticPages = [
    '',
    '/collections',
    '/collection/printemps-ete-2026-2027',
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

  // Toute la collection Terre a été retirée + les anciennes catégories
  // racine/empreinte ont été fusionnées dans « intemporels ». On n'exporte
  // dans le sitemap que les slugs toujours actifs.
  const productPages = PRODUCTS
    .filter((p) => ['intemporels', 'pe-2026-2027'].includes(p.category))
    .map((p) => ({
      url: `${BASE}/produit/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [...staticPages, ...categoryPages, ...productPages]
}
