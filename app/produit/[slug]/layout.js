import { permanentRedirect } from 'next/navigation'
import { loadProducts } from '@/lib/api/shared'
import { resolvePreviousSlug } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

// Ancienne adresse d'un produit (ex. « produit-1790005978336 ») → redirection 301 vers la nouvelle.
export default async function ProductLayout({ children, params }) {
  const { slug } = await params
  try {
    const all = await loadProducts()
    if (!all.some((p) => p.slug === slug)) {
      const next = await resolvePreviousSlug(slug)
      if (next && next !== slug) permanentRedirect(`/produit/${encodeURIComponent(next)}`)
    }
  } catch (e) {
    if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e
  }
  return children
}
