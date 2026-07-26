'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ProductCard from '@/components/site/product-card'
import { useCart } from '@/components/site/cart-provider'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import { Minus, Plus, Heart, Truck, Shield, Sparkles, ChevronDown } from 'lucide-react'

export default function ProductPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const [openInfo, setOpenInfo] = useState('desc')
  const [zoom, setZoom] = useState(null)
  const { add } = useCart()

  useEffect(() => {
    if (!slug) return
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
  }, [slug])

  if (!data?.product) {
    return (
      <div className="min-h-screen bg-ivory">
        <Header />
        <div className="container py-32 text-center text-ink/50">Chargement...</div>
      </div>
    )
  }

  const p = data.product
  const related = data.related || []

  const handleAdd = async () => {
    await add(p.slug, qty)
    toast.success(`${p.name} ajouté au panier`)
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="pt-6">
        {/* Breadcrumb */}
        <div className="container py-4 text-[11px] uppercase tracking-[0.22em] text-ink/50">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href={`/collections?cat=${p.category}`} className="hover:text-ink">{p.category}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{p.name}</span>
        </div>

        <section className="container grid md:grid-cols-2 gap-8 md:gap-16 py-8 md:py-14">
          {/* Gallery */}
          <div className="space-y-3">
            <motion.div
              key={active}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-[4/5] bg-cream overflow-hidden cursor-zoom-in"
              onClick={() => setZoom(p.images[active])}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[active]} alt={p.name} className="w-full h-full object-cover" />
              {p.isLimited && (
                <span className="absolute top-6 left-6 bg-terracotta text-ivory text-[10px] uppercase tracking-[0.22em] px-3 py-1.5">Édition limitée</span>
              )}
            </motion.div>
            <div className="grid grid-cols-3 gap-3">
              {p.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`aspect-square overflow-hidden bg-cream border ${active === i ? 'border-ink' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="md:pt-6 lg:pl-6">
            <div className="text-[10px] uppercase tracking-[0.36em] text-terracotta">{p.category}</div>
            <h1 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mt-3 text-balance">{p.name}</h1>
            <div className="flex items-center gap-4 mt-4">
              <span className="font-display text-2xl tabular-nums">{formatPrice(p.price)}</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">TVA incluse</span>
            </div>

            {/* Story */}
            <div className="mt-8 text-ink/75 leading-relaxed text-[15px] font-display italic border-l-2 border-terracotta pl-5">
              “{p.story}”
            </div>

            {/* Meta chips */}
            <div className="grid grid-cols-2 gap-3 mt-8 text-[13px]">
              <MetaRow k="Matière" v={p.material} />
              <MetaRow k="Dimensions" v={p.dimensions} />
              <MetaRow k="Poids" v={p.weight} />
              <MetaRow k="Fabrication" v={p.makingTime} />
              <MetaRow k="Couleur" v={p.color} />
              <MetaRow k="Origine" v="Fabrication française" />
            </div>

            {/* Qty + CTA */}
            <div className="mt-10 flex items-stretch gap-3">
              <div className="flex items-center border border-ink/30">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 h-full hover:bg-linen/40" aria-label="Diminuer"><Minus className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(p.stock, q + 1))} className="px-3 h-full hover:bg-linen/40" aria-label="Augmenter"><Plus className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
              </div>
              <button
                onClick={handleAdd}
                className="flex-1 bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors"
              >
                Ajouter au panier — {formatPrice(p.price * qty)}
              </button>
              <button
                onClick={() => toast('Ajouté aux favoris')}
                className="border border-ink/30 px-4 hover:bg-linen/40 transition"
                aria-label="Favoris"
              >
                <Heart className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.22em] text-ink/50">
              {p.stock > 5 ? 'En stock' : `Plus que ${p.stock} exemplaires`}
            </div>

            {/* Trust */}
            <div className="mt-10 grid grid-cols-3 gap-4 text-[11px] uppercase tracking-[0.18em] text-ink/60 border-t border-linen pt-6">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-terracotta" strokeWidth={1.5} />Livraison offerte 150€</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-terracotta" strokeWidth={1.5} />Paiement sécurisé</div>
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-terracotta" strokeWidth={1.5} />Emballage soigné</div>
            </div>

            {/* Accordions */}
            <div className="mt-10 border-t border-linen">
              {[
                ['desc', 'Description complète', <>
                  <p>{p.story}</p>
                  <p className="mt-3">Style : {p.style}. Toutes les pièces sont exécutées dans notre atelier français et légèrement différentes les unes des autres.</p>
                </>],
                ['care', 'Conseils d’entretien', <p key="care">{p.care}</p>],
                ['ship', 'Livraison', <p key="ship">Expédié sous 2 à 4 jours ouvrés en France métropolitaine. Livraison Europe en 5 à 8 jours. Emballage soigné et neutre en carbone.</p>],
              ].map(([id, title, content]) => (
                <div key={id} className="border-b border-linen">
                  <button
                    onClick={() => setOpenInfo((x) => (x === id ? '' : id))}
                    className="w-full flex items-center justify-between py-4 text-[12px] uppercase tracking-[0.24em] hover:text-terracotta transition"
                  >
                    {title}
                    <ChevronDown className={`h-4 w-4 transition-transform ${openInfo === id ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                  </button>
                  <AnimatePresence>
                    {openInfo === id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5 text-ink/70 text-sm leading-relaxed">{content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="container py-20 md:py-28">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-10">Pièces associées</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {related.map((r, i) => <ProductCard key={r.id} product={r} index={i} />)}
            </div>
          </section>
        )}
      </main>
      <Footer />
      <CartDrawer />

      {/* Zoom lightbox */}
      <AnimatePresence>
        {zoom && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/95 z-[70] flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setZoom(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoom} alt="" className="max-h-full max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetaRow({ k, v }) {
  return (
    <div className="border-b border-linen/70 py-2">
      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50">{k}</div>
      <div className="text-ink mt-0.5">{v}</div>
    </div>
  )
}
