import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import HeroCarousel from '@/components/home/hero-carousel'
import renderSection from '@/components/home/render-section'
import { getDb } from '@/lib/db'
import { mergeHomepageSections } from '@/lib/homepage-sections'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import EditModeProvider from '@/components/edit/edit-mode-provider'
import LiveSections from '@/components/edit/live-sections'
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

        {/* Sections modulaires — pilotées depuis /admin → Éditeur de l'accueil */}
        {editMode ? (
          <LiveSections fallback={sections} />
        ) : (
          sections.map((s) => renderSection(s))
        )}
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
