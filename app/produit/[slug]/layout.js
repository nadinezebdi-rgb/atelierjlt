import { permanentRedirect } from 'next/navigation'
import { loadProducts } from '@/lib/api/shared'
import { resolvePreviousSlug } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

// Titre + description de la fiche (ce que Google affiche) — même règle que l'aperçu de l'admin
export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const p = (await loadProducts()).find((x) => x.slug === slug)
    if (!p) return {}
    const desc = String(p.story || '').replace(/\s+/g, ' ').trim()
    const description = desc.length > 155 ? desc.slice(0, 152).replace(/\s+\S*$/, '').replace(/[\s.,;:!?…]+$/, '') + '…' : desc
    return {
      title: p.name,
      description: description || undefined,
      alternates: { canonical: `/produit/${p.slug}` },
      openGraph: { title: `${p.name} · Atelier JLT`, description: description || undefined, images: p.images?.[0] ? [p.images[0]] : undefined },
    }
  } catch {
    return {}
  }
}

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
