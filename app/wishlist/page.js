'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ProductCard from '@/components/site/product-card'
import { useAuth } from '@/components/site/auth-provider'
import { Heart } from 'lucide-react'

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetch('/api/wishlist', { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((d) => setItems(d.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="pt-14 md:pt-24 pb-24">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-[10px] uppercase tracking-[0.42em] text-emerald">Favoris</span>
            <h1
              className="text-4xl md:text-6xl leading-[1.02] mt-4 text-emerald"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Mes pièces préférées.
            </h1>
            <p className="text-ink/60 mt-4 italic">
              Les créations que vous aimez, conservées ici pour plus tard.
            </p>
          </div>

          {authLoading || loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-linen/60" />
                  <div className="h-4 bg-linen/60 mt-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : !user ? (
            <div className="text-center py-16">
              <Heart className="mx-auto h-8 w-8 text-emerald/50" strokeWidth={1.2} />
              <p className="mt-6 font-display text-2xl text-ink">Connectez-vous pour retrouver vos favoris.</p>
              <Link
                href="/compte"
                className="mt-8 inline-flex items-center gap-3 bg-emerald text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emeraldDark transition-colors"
              >
                Se connecter
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="mx-auto h-8 w-8 text-emerald/50" strokeWidth={1.2} />
              <p className="mt-6 font-display text-2xl text-ink">Aucun favori pour le moment.</p>
              <p className="text-ink/60 mt-3 italic">Cliquez sur le cœur d\u2019une pièce pour la retrouver ici.</p>
              <Link
                href="/collections"
                className="mt-8 inline-flex items-center gap-3 bg-emerald text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emeraldDark transition-colors"
              >
                Explorer les collections
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {items.map((p, i) => (
                <ProductCard key={p.id || p.slug} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
