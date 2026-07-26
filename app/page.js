import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import Hero from '@/components/home/hero'
import CategoryGrid from '@/components/home/category-grid'
import WhyGinette from '@/components/home/why-ginette'
import BestSellers from '@/components/home/best-sellers'
import Atelier from '@/components/home/atelier'
import CollectionsShowcase from '@/components/home/collections-showcase'
import InstagramGrid from '@/components/home/instagram-grid'
import Newsletter from '@/components/home/newsletter'

function App() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header transparent />
      <main>
        <Hero />
        <CategoryGrid />
        <WhyGinette />
        <BestSellers />
        <Atelier />
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
