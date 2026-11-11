'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ProductCard from '@/components/site/product-card'
import { CATEGORIES, COLLECTIONS } from '@/lib/data/products'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X } from 'lucide-react'

function CollectionsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  // Titres / sous-titres des catégories : modifiables dans /admin → Éditeur du site
  const [cats, setCats] = useState(CATEGORIES)
  useEffect(() => {
    fetch('/api/site-pages/categories').then((r) => r.json()).then((d) => Array.isArray(d.categories) && setCats(d.categories)).catch(() => {})
  }, [])
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
    router.push(`${pathname || '/produits'}?${next.toString()}`)
  }

  const activeCat = cats.find((c) => c.slug === cat)
  const title = activeCat?.name || 'Tous nos produits'
  const subtitle = (activeCat ? activeCat.tagline : '') || (activeCat ? '' : 'Toutes les créations de la maison, faites main.')

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
          <span className="text-[10px] uppercase tracking-[0.36em] text-emerald">{activeCat?.eyebrow || 'Produits'}</span>
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
            {cats.map((c) => (
              <button
                key={c.slug}
                onClick={() => set('cat', c.slug)}
                className={`text-[11px] uppercase tracking-[0.22em] whitespace-nowrap py-1 border-b ${cat === c.slug ? 'border-ink' : 'border-transparent text-ink/50 hover:text-ink'}`}
              >{c.name}</button>
            ))}
            <Link
              href="/collection/printemps-ete-2027"
              className="text-[11px] uppercase tracking-[0.22em] whitespace-nowrap py-1 border-b border-transparent text-ink/50 hover:text-ink"
            >Printemps/Été 2027</Link>
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
              <div className="md:col-span-3">
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
          ) : !cat && !q ? (
            // « Tous les produits » : une partie par collection, la collection
            // Printemps/Été 2027 a toujours sa place, même sans pièces
            <div className="space-y-20 md:space-y-28">
              {[
                { key: 'intemporels', title: 'Les Intemporels', eyebrow: 'Collection permanente', items: products.filter((p) => p.category === 'intemporels') },
                { key: 'pe-2026-2027', title: 'Printemps/Été 2027', eyebrow: 'Nouvelle collection', href: '/collection/printemps-ete-2027', items: products.filter((p) => p.category === 'pe-2026-2027') },
                { key: 'autres', title: 'Autres créations', eyebrow: 'Atelier', items: products.filter((p) => !['intemporels', 'pe-2026-2027'].includes(p.category)) },
              ].filter((g) => g.key === 'pe-2026-2027' || g.items.length > 0).map((g) => (
                <section key={g.key} data-testid={`group-${g.key}`}>
                  <div className="flex items-end justify-between gap-4 mb-8 md:mb-10 border-b border-linen pb-5">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.36em] text-emerald">{g.eyebrow}</span>
                      <h2 className="text-3xl md:text-5xl mt-2 leading-[1.05] text-emerald" style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}>{g.title}</h2>
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">{g.items.length} création{g.items.length > 1 ? 's' : ''}</span>
                      {g.href && <Link href={g.href} className="hidden md:inline text-[11px] uppercase tracking-[0.22em] border-b border-ink/30 hover:border-ink">Voir la collection</Link>}
                    </div>
                  </div>
                  {g.items.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                      {g.items.map((p, i) => <ProductCard key={p.id || p.slug} product={p} index={i} />)}
                    </div>
                  ) : (
                    <div className="border border-dashed border-ink/20 bg-cream/40 py-16 px-6 text-center">
                      <p className="text-2xl md:text-3xl text-ink" style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}>Les pièces arrivent.</p>
                      <p className="text-ink/60 mt-3 italic max-w-md mx-auto">Les créations de la collection Printemps/Été 2027 seront dévoilées très bientôt.</p>
                      <Link href="/collection/printemps-ete-2027" className="inline-block mt-6 text-[11px] uppercase tracking-[0.22em] border-b border-ink/30 hover:border-ink">Découvrir les couleurs et ambiances</Link>
                    </div>
                  )}
                </section>
              ))}
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
