import CategoryTiles from '@/components/home/category-tiles'
import EditorialBanner from '@/components/home/editorial-banner'
import ProductCarousel from '@/components/home/product-carousel'
import CarouselImageGallery from '@/components/home/carousel-image-gallery'
import CollectionsThemes from '@/components/home/collections-themes'
import Newsletter from '@/components/home/newsletter'
import { getCarouselMode } from '@/lib/homepage-sections'

/**
 * Rendu d'une section modulaire de la page d'accueil.
 * Partagé entre le rendu public (serveur) et l'aperçu en direct du mode
 * édition (client) — ainsi ce que l'on voit en éditant est exactement ce
 * qui sera publié.
 */
export default function renderSection(s, { ignoreEnabled = false } = {}) {
  if (!s) return null
  if (!ignoreEnabled && s.enabled === false) return null
  const c = s.content || {}
  switch (s.type) {
    case 'category-tiles':
      return null // collections retirées du site
    case 'editorial-banner':
      return (
        <EditorialBanner
          key={s.id}
          image={c.image}
          eyebrow={c.eyebrow}
          title={c.title}
          cta={c.ctaLabel && c.ctaHref ? { label: c.ctaLabel, href: c.ctaHref } : undefined}
          align={c.align || 'left'}
          overlay={c.overlay || 'dark'}
          height={c.height || 'md'}
        />
      )
    case 'product-carousel': {
      const mode = getCarouselMode(c)
      const picked = Array.isArray(c.pickedProducts) ? c.pickedProducts : []
      // Mode « Je choisis les produits » : vitrine manuelle, dans l'ordre choisi
      if (mode === 'manual' && picked.length > 0) {
        return (
          <ProductCarousel
            key={s.id}
            eyebrow={c.eyebrow}
            title={c.title}
            description={c.description}
            viewAllHref={c.viewAllHref}
            limit={picked.length}
            hideBadges={c.hideBadges === true}
            pickedSlugs={picked}
          />
        )
      }
      // Ancien mode galerie d'images — conservé uniquement pour les anciennes
      // sections jamais repassées en mode produits.
      if (!c.selectionMode && Array.isArray(c.customImages) && c.customImages.length > 0) {
        return (
          <CarouselImageGallery
            key={s.id}
            eyebrow={c.eyebrow}
            title={c.title}
            viewAllHref={c.viewAllHref}
            images={c.customImages}
          />
        )
      }
      return (
        <ProductCarousel
          key={s.id}
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          viewAllHref={c.viewAllHref}
          filter={c.filter}
          limit={Number(c.limit) || 8}
          hideBadges={c.hideBadges === true}
        />
      )
    }
    case 'collections-themes':
      return null // collections retirées du site
    case 'newsletter':
      return (
        <Newsletter
          key={s.id}
          eyebrow={c.eyebrow}
          title={c.title}
          description={c.description}
          placeholder={c.placeholder}
          buttonLabel={c.buttonLabel}
        />
      )
    default:
      return null
  }
}
