'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ProductCard from '@/components/site/product-card'
import { CATEGORIES, COLLECTIONS } from '@/lib/data/products'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'

function CollectionsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const cat = params.get('cat') || ''
  const collection = params.get('collection') || ''
  const q = params.get('q') || ''
  const sort = params.get('sort') || 'featured'

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    setLoading(true)
    const u = new URL('/api/products', window.location.origin)
    if (cat) u.searchParams.set('cat', cat)
    if (collection) u.searchParams.set('collection', collection)
    if (q) u.searchParams.set('q', q)
    if (sort) u.searchParams.set('sort', sort)
    fetch(u.toString())
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false))
  }, [cat, collection, q, sort])

  const set = (key, val) => {
    const next = new URLSearchParams(params.toString())
    if (val) next.set(key, val)
    else next.delete(key)
    router.push(`/collections?${next.toString()}`)
  }

  const activeCat = CATEGORIES.find((c) => c.slug === cat)
  const activeCol = COLLECTIONS.find((c) => c.slug === collection)
  const title = activeCat?.name || activeCol?.name || 'Toutes les créations'
  const subtitle = activeCat?.tagline || activeCol?.story || 'Une sélection complète de la maison.'

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="pt-8 md:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="container pb-10 md:pb-16 border-b border-linen"
        >
          <span className="text-[10px] uppercase tracking-[0.36em] text-emerald">Collections</span>
          <h1 className="font-display font-normal text-4xl md:text-6xl mt-4 leading-[1.02] text-balance text-emerald"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}>{title}</h1>
          <p className="text-ink/60 mt-4 max-w-xl italic">{subtitle}</p>
        </motion.div>

        <div className="container py-8 flex items-center justify-between gap-4 border-b border-linen sticky top-[80px] md:top-[144px] bg-ivory/90 backdrop-blur z-20">
          <div className="flex items-center gap-3 md:gap-5 overflow-auto no-scrollbar">
            <button
              onClick={() => set('cat', '')}
              className={`text-[11px] uppercase tracking-[0.22em] whitespace-nowrap py-1 border-b ${!cat ? 'border-ink' : 'border-transparent text-ink/50'}`}
            >Tout</button>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => set('cat', c.slug)}
                className={`text-[11px] uppercase tracking-[0.22em] whitespace-nowrap py-1 border-b ${cat === c.slug ? 'border-ink' : 'border-transparent text-ink/50 hover:text-ink'}`}
              >{c.name}</button>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={sort}
              onChange={(e) => set('sort', e.target.value)}
              className="hidden md:block bg-transparent text-[11px] uppercase tracking-[0.22em] border-b border-ink/20 focus:outline-none py-1"
            >
              <option value="featured">Mise en avant</option>
              <option value="new">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] hover:text-terracotta transition"
            >
              <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} /> Filtres
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="container py-6 border-b border-linen bg-cream/40">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Collection</label>
                <select value={collection} onChange={(e) => set('collection', e.target.value)} className="mt-2 w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none">
                  <option value="">Toutes</option>
                  {COLLECTIONS.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Recherche</label>
                <div className="flex items-center border-b border-ink/20 mt-2">
                  <Search className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
                  <input
                    defaultValue={q}
                    onKeyDown={(e) => { if (e.key === 'Enter') set('q', e.currentTarget.value) }}
                    placeholder="Rechercher une pièce, une matière..."
                    className="flex-1 bg-transparent py-2 px-3 focus:outline-none placeholder:text-ink/30"
                  />
                  {q && <button onClick={() => set('q', '')}><X className="h-4 w-4 text-ink/40" /></button>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="container py-12 md:py-16">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-linen/60" />
                  <div className="h-4 bg-linen/60 mt-4 w-2/3" />
                  <div className="h-3 bg-linen/40 mt-2 w-1/3" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <p className="font-display text-3xl">Aucune création ne correspond.</p>
              <p className="text-ink/60 mt-3">Essayez d'élargir votre recherche.</p>
            </div>
          ) : (
            <>
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50 mb-8">{products.length} création{products.length > 1 ? 's' : ''}</div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ivory" />}>
      <CollectionsInner />
    </Suspense>
  )
}
