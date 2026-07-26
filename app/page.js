import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import Hero from '@/components/home/hero'
import CategoryGrid from '@/components/home/category-grid'
import WhyGinette from '@/components/home/why-ginette'
import BestSellers from '@/components/home/best-sellers'
import Atelier from '@/components/home/atelier'
import Lifestyle from '@/components/home/lifestyle'
import ChezGinette from '@/components/home/chez-ginette'
import CollectionsShowcase from '@/components/home/collections-showcase'
import InstagramGrid from '@/components/home/instagram-grid'
import Newsletter from '@/components/home/newsletter'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Atelier Ginette',
  alternateName: 'Atelier Ginette',
  url: 'https://atelierginette.fr',
  logo: 'https://atelierginette.fr/api/img/logo',
  description: 'Maison française de décoration artisanale. Sacs crochet, plaids, bougies, bijoux, coussins faits main.',
  sameAs: [
    'https://www.instagram.com/ginette.creations/',
    'https://www.facebook.com/ginette.creations/',
  ],
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'FR',
    addressRegion: 'Drôme',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    email: 'contact@atelierginette.fr',
    availableLanguage: ['French'],
  },
}

function App() {
  return (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header transparent />
      <main>
        <Hero />
        <CategoryGrid />
        <WhyGinette />
        <BestSellers />
        <Atelier />
        <Lifestyle />
        <ChezGinette />
        <CollectionsShowcase />
        <InstagramGrid />
        <Newsletter />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default App
