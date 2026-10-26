import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { getDb } from '@/lib/db'
import PESeasonalPage from '@/components/collection/pe-seasonal-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Collection Printemps / Été 2026-2027 — Atelier JLT',
  description:
    'Doux, chaleureux, bien chez soi. Pastels et touches flash en coton, trapilho et rafia. Plaids, coussins, tapis et paniers de la nouvelle saison Atelier JLT.',
}

import { PE_DEFAULTS as DEFAULT } from '@/lib/page-content-config'

async function loadContent() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    const saved = doc?.content?.collectionPE2027 || {}
    // Shallow merge — l'admin peut n'avoir modifié qu'un sous-ensemble
    return {
      ...DEFAULT,
      ...saved,
      palette: Array.isArray(saved.palette) && saved.palette.length > 0 ? saved.palette : DEFAULT.palette,
      materials: Array.isArray(saved.materials) && saved.materials.length > 0 ? saved.materials : DEFAULT.materials,
    }
  } catch {
    return DEFAULT
  }
}

async function loadProducts() {
  try {
    const res = await fetch(
      (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') +
        '/api/products?cat=pe-2026-2027',
      { cache: 'no-store' }
    )
    const data = await res.json()
    return Array.isArray(data?.products) ? data.products : []
  } catch {
    return []
  }
}

export default async function CollectionPEPage() {
  const [content, products] = await Promise.all([loadContent(), loadProducts()])
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <PESeasonalPage content={content} products={products} />
      <Footer />
      <CartDrawer />
    </div>
  )
}
