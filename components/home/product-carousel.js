'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowRight, Plus } from 'lucide-react'
import { useCart } from '@/components/site/cart-provider'
import { toast } from 'sonner'

/**
 * Carrousel produits style Ferm Living — défilement horizontal souple,
 * chaque carte : image + tag New/Limited + nom + prix + bouton “+ Ajouter”.
 *
 * Props :
 *  - eyebrow (petit texte)
 *  - title   (h2 éditoriale)
 *  - viewAllHref (lien tout voir)
 *  - endpoint : URL API renvoyant { products: [] } — utilisé pour charger la liste
 *  - fallback : liste PRODUCTS pré-importée (optionnelle)
 *  - filter   : (p) => bool  filtre client (nouveautés / featured)
 */
export default function ProductCarousel({ eyebrow, title, viewAllHref, endpoint = '/api/products', filter, limit = 8 }) {
  const [products, setProducts] = useState([])
  const scrollRef = useRef(null)
  const { add } = useCart()

  useEffect(() => {
    let cancelled = false
    fetch(endpoint, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        let list = d.products || []
        if (filter === 'new') list = list.filter((p) => p.isNew)
        else if (filter === 'limited') list = list.filter((p) => p.isLimited)
        else if (filter === 'bestsellers') list = list.filter((p) => !p.isLimited)
        setProducts(list.slice(0, limit))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [endpoint, filter, limit])

  const scroll = (dir) => {
    if (!scrollRef.current) return
    const w = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({ left: dir === 'next' ? w : -w, behavior: 'smooth' })
  }

  const handleAdd = async (p) => {
    const r = await add(p.slug, 1)
    if (r?.ok || r === undefined) toast.success(`${p.name} ajouté`)
    else toast.error(r.error || 'Erreur')
  }

  if (!products.length) return null

  return (
    <section className="py-16 md:py-24 bg-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
          <div>
            {eyebrow && (
              <span className="block text-[10px] uppercase tracking-[0.42em] text-emerald mb-3">{eyebrow}</span>
            )}
            <h2
              className="font-display text-3xl md:text-5xl leading-[1.05] text-balance"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => scroll('prev')} aria-label="Précédent" className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-emerald hover:text-emerald transition">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button onClick={() => scroll('next')} aria-label="Suivant" className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 hover:border-emerald hover:text-emerald transition">
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
            {viewAllHref && (
              <Link href={viewAllHref} className="group ml-3 hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] hover:text-emerald transition-colors">
                Tout voir
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-6 px-6 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {products.map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.05 }}
              className="snap-start shrink-0 w-[75%] sm:w-[46%] md:w-[30%] lg:w-[23%]"
            >
              <Link href={`/produit/${p.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images?.[0]}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.03]"
                  />
                  {p.isNew && (
                    <span className="absolute top-3 left-3 bg-ivory text-ink text-[9px] uppercase tracking-[0.3em] px-2 py-1">Nouveau</span>
                  )}
                  {p.isLimited && (
                    <span className="absolute top-3 right-3 bg-brique text-ivory text-[9px] uppercase tracking-[0.3em] px-2 py-1">Édition</span>
                  )}
                </div>
                <div className="pt-4 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[15px] md:text-[16px] leading-snug text-ink truncate"
                         style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}>
                      {p.name}
                    </div>
                    <div className="text-[13px] text-ink/60 mt-1 tabular-nums">EUR {p.price.toFixed(0)},00</div>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleAdd(p)}
                className="mt-3 group/btn inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-ink/80 hover:text-emerald transition-colors"
              >
                <Plus className="h-3 w-3" strokeWidth={1.5} /> Ajouter au panier
              </button>
            </motion.div>
          ))}
        </div>

        {viewAllHref && (
          <div className="mt-8 md:hidden text-center">
            <Link href={viewAllHref} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]">
              Tout voir <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
