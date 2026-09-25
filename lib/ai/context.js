/**
 * Construction du contexte transmis à Claude Sonnet.
 * On garde un JSON compact : slug, nom, prix, matières, catégorie, description courte.
 */
import { getDb } from '@/lib/db'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'

async function loadMergedProducts() {
  const db = await getDb()
  const [overrides, custom] = await Promise.all([
    db.collection('product_overrides').find({}).toArray(),
    db.collection('products_custom').find({}).toArray(),
  ])
  const overrideMap = new Map(overrides.map((o) => [o.slug, o]))
  const merged = BASE_PRODUCTS.map((p) => {
    const o = overrideMap.get(p.slug)
    return o ? { ...p, ...o.data, slug: p.slug, id: p.id } : p
  })
  const customs = custom.map((c) => ({ ...c.data, slug: c.slug, id: c._id }))
  return [...merged, ...customs]
}

/** Résumé d'un produit — compact pour tenir dans le prompt. */
function compactProduct(p) {
  const mat = Array.isArray(p.materials) ? p.materials.slice(0, 3) : (p.material ? [p.material] : [])
  return {
    slug: p.slug,
    name: p.name,
    price: p.price,
    category: p.category,
    color: p.color,
    style: p.style,
    materials: mat,
    dimensions: p.dimensions,
    care: p.care,
    stock: p.stock,
    isNew: !!p.isNew,
    tags: p.tags || [],
    shortDescription: (p.description || p.tagline || p.story || '').slice(0, 220),
    variants: (p.variants || []).map((v) => v.label || v.name).slice(0, 4),
    sizes: (p.sizes || []).map((s) => s.label || s.name).slice(0, 4),
  }
}

/**
 * Contexte pour le mode CLIENT (lecture seule) :
 * - Liste des produits (compacte)
 * - Infos boutique (livraison, retours, contact)
 */
export async function buildClientContext() {
  const products = await loadMergedProducts()
  return {
    shop: {
      name: 'Atelier JLT',
      shipping: 'Livraison offerte dès 150 € en France métropolitaine, expédition sous 2 à 5 jours ouvrés.',
      returns: 'Retours gratuits sous 14 jours, produits neufs et emballage d\'origine.',
      artisanat: 'Fabrication française à la main dans notre atelier en Bretagne.',
      contact: 'contact@atelierjlt.fr',
    },
    products: products.map(compactProduct),
  }
}

/**
 * Contexte pour le mode ADMIN — inclut le catalogue complet + hero + sections + blog.
 * Utilisé pour que Claude puisse proposer des modifs cohérentes.
 */
export async function buildAdminContext() {
  const db = await getDb()
  const [products, siteContent, blogPosts] = await Promise.all([
    loadMergedProducts(),
    db.collection('site_content').findOne({ _id: 'home' }),
    db.collection('blog_posts').find({}).sort({ createdAt: -1 }).limit(20).toArray(),
  ])
  return {
    products: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      category: p.category,
      materials: p.materials?.slice(0, 3),
      shortDescription: (p.description || '').slice(0, 160),
    })),
    hero: siteContent?.content?.hero || null,
    heroSlidesCount: (siteContent?.content?.heroSlides || []).length,
    sections: (siteContent?.content?.sections || []).map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      visible: s.visible !== false,
      order: s.order,
    })),
    blogPosts: blogPosts.map((b) => ({
      slug: b.slug,
      title: b.title,
      published: !!b.published,
    })),
  }
}
