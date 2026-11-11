import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { getDb } from '@/lib/db'
import { cleanBrandDeep } from '@/lib/brand-text'
import { loadProducts as loadCatalog } from '@/lib/api/shared'
import PESeasonalPage from '@/components/collection/pe-seasonal-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Collection Printemps / Été 2027 — Atelier JLT',
  description:
    'Doux, chaleureux, bien chez soi. Pastels et touches flash en coton, trapilho et rafia. Plaids, coussins, tapis et paniers de la nouvelle saison Atelier JLT.',
}

import { PE_DEFAULTS as DEFAULT } from '@/lib/page-content-config'

async function loadContent() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    const saved = cleanBrandDeep(doc?.content?.collectionPE2027 || {})
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

// Seules les pièces rangées dans la collection « Printemps/Été » (champ Collection
// de la fiche produit dans l'admin) — jamais Les Intemporels.
async function loadProducts() {
  try {
    const all = await loadCatalog()
    return JSON.parse(JSON.stringify(all.filter((p) => p.category === 'pe-2026-2027')))
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
