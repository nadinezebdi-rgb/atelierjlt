import { CATEGORIES } from '@/lib/data/products'
import { loadProducts } from '@/lib/api/shared'

export const dynamic = 'force-dynamic'

const BASE = 'https://atelierjlt.fr'

export default async function sitemap() {
  const now = new Date()
  const staticPages = [
    '',
    '/produits',
    '/collection/printemps-ete-2027',
    '/a-propos',
    '/journal',
    '/contact',
    '/cgv',
    '/livraison',
    '/suivi',
    '/confidentialite',
    '/mentions-legales',
  ].map((p) => ({
    url: `${BASE}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.7,
  }))

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${BASE}/produits?cat=${c.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Produits réellement en vente (catalogue + créations ajoutées dans l'admin)
  let products = []
  try { products = await loadProducts() } catch { products = [] }
  const productPages = products.map((p) => ({
    url: `${BASE}/produit/${p.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...categoryPages, ...productPages]
}
