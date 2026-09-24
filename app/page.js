import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import HeroFerm from '@/components/home/hero-ferm'
import CategoryTiles from '@/components/home/category-tiles'
import EditorialBanner from '@/components/home/editorial-banner'
import ProductCarousel from '@/components/home/product-carousel'
import CollectionsThemes from '@/components/home/collections-themes'
import Newsletter from '@/components/home/newsletter'
import { getDb } from '@/lib/db'
import { mergeHomepageSections } from '@/lib/homepage-sections'

// Toujours frais : les changements admin apparaissent immédiatement
export const dynamic = 'force-dynamic'
export const revalidate = 0

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Atelier JLT',
  alternateName: 'Atelier JLT',
  url: 'https://atelierjlt.fr',
  logo: 'https://atelierjlt.fr/api/img/logo',
  description: 'Maison française de décoration artisanale. Plaids, coussins, macramé, tapis, poterie faits main.',
  sameAs: [
    'https://www.instagram.com/atelier.jlt/',
    'https://www.facebook.com/atelier.jlt/',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
    addressRegion: 'Drôme',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@atelierjlt.fr',
    availableLanguage: ['French'],
  },
}

async function loadHomepageSections() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    return mergeHomepageSections(doc?.content?.sections || [])
  } catch (e) {
    return mergeHomepageSections(null)
  }
}

function renderSection(s) {
  if (!s.enabled) return null
  const c = s.content || {}
  switch (s.type) {
    case 'category-tiles':
      return <CategoryTiles key={s.id} />
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
    case 'product-carousel':
      return (
        <ProductCarousel
          key={s.id}
          eyebrow={c.eyebrow}
          title={c.title}
          viewAllHref={c.viewAllHref}
          filter={c.filter}
          limit={Number(c.limit) || 8}
        />
      )
    case 'collections-themes':
      return <CollectionsThemes key={s.id} />
    case 'newsletter':
      return <Newsletter key={s.id} />
    default:
      return null
  }
}

async function App() {
  const sections = await loadHomepageSections()
  return (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* HERO — non-toggleable */}
        <HeroFerm />

        {/* Sections modulaires — pilotées depuis /admin → Contenu du site */}
        {sections.map(renderSection)}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default App
