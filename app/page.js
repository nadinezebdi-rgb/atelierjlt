import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import HeroCarousel from '@/components/home/hero-carousel'
import CategoryTiles from '@/components/home/category-tiles'
import EditorialBanner from '@/components/home/editorial-banner'
import ProductCarousel from '@/components/home/product-carousel'
import CarouselImageGallery from '@/components/home/carousel-image-gallery'
import CollectionsThemes from '@/components/home/collections-themes'
import Newsletter from '@/components/home/newsletter'
import { getDb } from '@/lib/db'
import { mergeHomepageSections } from '@/lib/homepage-sections'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import EditModeProvider from '@/components/edit/edit-mode-provider'
import SectionShell from '@/components/edit/section-shell'
import HeroShell from '@/components/edit/hero-shell'

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

async function loadHomeContent() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    return {
      sections: mergeHomepageSections(doc?.content?.sections || []),
      hero: doc?.content?.hero || null,
      heroSlides: doc?.content?.heroSlides || [],
      rotationInterval: doc?.content?.rotationInterval || 5000,
    }
  } catch (e) {
    return { sections: mergeHomepageSections(null), hero: null, heroSlides: [], rotationInterval: 5000 }
  }
}

function heroToProps(h) {
  if (!h) return null
  return {
    media: h.image,
    eyebrow: h.eyebrow,
    title: h.title,
    subtitle: h.subtitle,
    ctaPrimary: h.ctaPrimary,
    ctaSecondary: h.ctaSecondary,
    signature: h.signature,
    layout: h.layout,
    textPosition: h.textPosition,
    overlayIntensity: h.overlayIntensity,
    showEyebrow: h.showEyebrow !== false,
    showTitle: h.showTitle !== false,
    showSubtitle: h.showSubtitle !== false,
    showPrimary: h.showPrimary !== false,
    showSecondary: h.showSecondary !== false,
    showSignature: h.showSignature !== false,
    useCustomPosition: !!h.useCustomPosition,
    textCoords: h.textCoords || { x: 8, y: 65 },
    textAlign: h.textAlign || 'left',
    textColorMode: h.textColorMode || 'auto',
    heroTextColor: h.heroTextColor || 'white',
    parallaxEnabled: !!h.parallaxEnabled,
    parallaxIntensity: h.parallaxIntensity ?? 25,
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
      // Mode "images personnalisées" si customImages non vide, sinon carrousel produits
      if (Array.isArray(c.customImages) && c.customImages.length > 0) {
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
    case 'collections-themes':
      return <CollectionsThemes key={s.id} />
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

async function App({ searchParams }) {
  const sp = await searchParams
  const editRequested = sp?.edit === '1'

  // Vérifie l'authentification admin via le cookie session
  let isAdminAuthed = false
  if (editRequested) {
    try {
      const cookieStore = await cookies()
      const token = cookieStore.get('ginette_admin')?.value
      isAdminAuthed = verifyToken(token)?.type === 'admin'
    } catch { isAdminAuthed = false }
  }
  const editMode = editRequested && isAdminAuthed

  const { sections, hero, heroSlides, rotationInterval } = await loadHomeContent()
  const slides = [heroToProps(hero), ...(heroSlides || []).map(heroToProps)].filter(Boolean)

  const inner = (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        {/* HERO — carrousel si plusieurs compositions, sinon rendu unique */}
        {editMode ? (
          <HeroShell>
            <HeroCarousel slides={slides} intervalMs={rotationInterval} />
          </HeroShell>
        ) : (
          <HeroCarousel slides={slides} intervalMs={rotationInterval} />
        )}

        {/* Sections modulaires — pilotées depuis /admin → Contenu du site */}
        {sections.map((s) => {
          const rendered = renderSection(s)
          if (!editMode) return rendered
          return (
            <SectionShell key={s.id} section={s}>
              {rendered}
            </SectionShell>
          )
        })}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )

  if (editMode) {
    return (
      <EditModeProvider
        initialSections={sections}
        initialHero={hero}
        initialHeroSlides={heroSlides}
      >
        {inner}
      </EditModeProvider>
    )
  }

  // Redirection douce : si ?edit=1 sans auth admin → page login
  if (editRequested && !isAdminAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory text-ink p-6">
        <div className="max-w-sm w-full text-center space-y-5">
          <h1
            className="text-2xl md:text-3xl text-emerald"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif' }}
          >
            Mode édition
          </h1>
          <p className="text-sm text-ink/70 leading-relaxed">
            Connectez-vous à l'administration pour activer l'édition visuelle.
          </p>
          <a
            href="/admin"
            className="inline-flex items-center justify-center h-12 px-6 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition rounded-sm"
          >
            Aller à l'admin
          </a>
        </div>
      </div>
    )
  }

  return inner
}

export default App
