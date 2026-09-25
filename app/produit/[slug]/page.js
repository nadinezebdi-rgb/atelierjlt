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
import ZoomableImage from '@/components/site/zoomable-image'

export default function ProductPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [active, setActive] = useState(0)
  const [qty, setQty] = useState(1)
  const [openInfo, setOpenInfo] = useState('desc')
  const [zoom, setZoom] = useState(null)
  const [variantIdx, setVariantIdx] = useState(0)
  const [sizeIdx, setSizeIdx] = useState(0)
  const { add } = useCart()

  useEffect(() => {
    if (!slug) return
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        // Sélectionne le variant par défaut, en préférant une couleur en stock
        if (d?.product?.variants?.length) {
          const vs = d.product.variants
          const defaultIdx = vs.findIndex((v) => v.isDefault)
          const defaultOk = defaultIdx >= 0 && (vs[defaultIdx].stock || 0) > 0
          if (defaultOk) setVariantIdx(defaultIdx)
          else {
            const firstInStock = vs.findIndex((v) => (v.stock || 0) > 0)
            setVariantIdx(firstInStock >= 0 ? firstInStock : (defaultIdx >= 0 ? defaultIdx : 0))
          }
        }
        // Sélectionne la taille par défaut, en préférant une taille en stock
        if (d?.product?.sizes?.length) {
          const ss = d.product.sizes
          const defaultIdx = ss.findIndex((s) => s.isDefault)
          const defaultOk = defaultIdx >= 0 && (ss[defaultIdx].stock || 0) > 0
          if (defaultOk) setSizeIdx(defaultIdx)
          else {
            const firstInStock = ss.findIndex((s) => (s.stock || 0) > 0)
            setSizeIdx(firstInStock >= 0 ? firstInStock : (defaultIdx >= 0 ? defaultIdx : 0))
          }
        }
      })
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
  const variants = p.variants || []
  const sizes = p.sizes || []
  const selectedVariant = variants.length ? variants[variantIdx] : null
  const selectedSize = sizes.length ? sizes[sizeIdx] : null
  // Utilise l'image du variant en priorité sinon la galerie normale
  const galleryImages = selectedVariant?.image
    ? [selectedVariant.image, ...(p.images || []).filter((i) => i !== selectedVariant.image)]
    : p.images
  // Stock effectif : min entre variant et taille, ou fallback stock produit
  const effectiveStock = Math.min(
    selectedVariant ? (selectedVariant.stock ?? Infinity) : Infinity,
    selectedSize ? (selectedSize.stock ?? Infinity) : Infinity,
    p.stock ?? Infinity
  )
  // Prix : la taille prime sur le variant qui prime sur le prix produit
  const effectivePrice = selectedSize?.price ?? selectedVariant?.price ?? p.price
  const effectiveColor = selectedVariant?.name || p.color
  const effectiveDimensions = selectedSize?.dimensions || p.dimensions
  const effectiveMakingTime = selectedSize?.makingTime || p.makingTime

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.story,
    image: p.images.map((img) => (img.startsWith('http') ? img : `https://atelierjlt.fr${img}`)),
    sku: p.id,
    brand: { '@type': 'Brand', name: 'Atelier JLT' },
    category: p.category,
    material: p.material,
    color: p.color,
    offers: {
      '@type': 'Offer',
      url: `https://atelierjlt.fr/produit/${p.slug}`,
      priceCurrency: 'EUR',
      price: p.price,
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Atelier JLT' },
    },
  }

  const handleAdd = async () => {
    const extra = {}
    if (selectedVariant) extra.variant = selectedVariant.name
    if (selectedSize) extra.size = selectedSize.label
    await add(p.slug, qty, extra)
    const parts = []
    if (selectedVariant) parts.push(selectedVariant.name)
    if (selectedSize) parts.push(selectedSize.label)
    toast.success(
      parts.length
        ? `${p.name} — ${parts.join(' · ')} ajouté au panier`
        : `${p.name} ajouté au panier`
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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
            <ZoomableImage
              src={galleryImages[active]}
              alt={p.name}
              keyId={selectedVariant?.name + '-' + active}
              onClickZoom={() => setZoom(galleryImages[active])}
              badge={p.isLimited ? 'Édition limitée' : null}
            />
            <div className="grid grid-cols-3 gap-3">
              {galleryImages.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setActive(i)}
                  className={`aspect-square overflow-hidden bg-cream border ${active === i ? 'border-emerald' : 'border-transparent'}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="md:pt-6 lg:pl-6">
            <div className="text-[10px] uppercase tracking-[0.36em] text-emerald">Collection {p.category}</div>
            <h1 className="font-display font-normal text-4xl md:text-5xl leading-[1.05] mt-3 text-balance"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}>{p.name}</h1>
            <div className="flex items-center gap-4 mt-4">
              <span className="font-display text-2xl tabular-nums">{formatPrice(effectivePrice)}</span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">TVA incluse</span>
            </div>

            {/* Story */}
            <div className="mt-8 text-ink/75 leading-relaxed text-[15px] font-display italic border-l-2 border-emerald pl-5">
              “{p.story}”
            </div>

            {/* Sizes — sélecteur de taille */}
            {sizes.length > 0 && (
              <div className="mt-8">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.28em] text-ink/60">
                    Taille : <span className="text-ink font-medium">{selectedSize?.label}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                    {selectedSize?.dimensions}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((s, i) => {
                    const isSelected = i === sizeIdx
                    const isOut = (s.stock || 0) === 0
                    return (
                      <button
                        key={s.label}
                        onClick={() => { setSizeIdx(i); setQty(1) }}
                        disabled={isOut}
                        title={s.dimensions + (isOut ? ' — épuisé' : '')}
                        className={`px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] border transition ${
                          isSelected
                            ? 'bg-emerald text-ivory border-emerald'
                            : 'bg-transparent border-ink/25 text-ink hover:border-emerald hover:text-emerald'
                        } ${isOut ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{s.label}</span>
                          <span className={`tabular-nums ${isSelected ? 'text-ivory/80' : 'text-ink/50'}`}>
                            · {formatPrice(s.price)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Variants — sélecteur de couleur */}
            {variants.length > 0 && (
              <div className="mt-8">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-[0.28em] text-ink/60">
                    Couleur : <span className="text-ink font-medium">{effectiveColor}</span>
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                    {variants.length} {variants.length > 1 ? 'nuances' : 'nuance'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {variants.map((v, i) => {
                    const isSelected = i === variantIdx
                    const isOut = (v.stock || 0) === 0
                    return (
                      <button
                        key={v.name}
                        onClick={() => { setVariantIdx(i); setActive(0); setQty(1) }}
                        disabled={isOut}
                        title={v.name + (isOut ? ' — épuisé' : '')}
                        className={`group relative h-10 w-10 rounded-full flex items-center justify-center transition ${
                          isSelected ? 'ring-2 ring-offset-2 ring-emerald ring-offset-ivory' : 'ring-1 ring-ink/15 hover:ring-emerald'
                        } ${isOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span
                          className="h-8 w-8 rounded-full block border border-ink/10"
                          style={{ backgroundColor: v.hex }}
                        />
                        {isOut && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="block h-[1px] w-8 bg-ink/80 rotate-45" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Meta chips */}
            <div className="grid grid-cols-2 gap-3 mt-8 text-[13px]">
              <MetaRow k="Matière" v={p.material} />
              <MetaRow k="Dimensions" v={effectiveDimensions} />
              <MetaRow k="Poids" v={p.weight} />
              <MetaRow k="Fabrication" v={effectiveMakingTime} />
              <MetaRow k="Couleur" v={effectiveColor} />
              <MetaRow k="Origine" v="Fabrication française" />
            </div>

            {/* Qty + CTA */}
            <div className="mt-10 flex items-stretch gap-3">
              <div className="flex items-center border border-ink/30">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 h-full hover:bg-linen/40" aria-label="Diminuer"><Minus className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))} className="px-3 h-full hover:bg-linen/40" aria-label="Augmenter"><Plus className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
              </div>
              <button
                onClick={handleAdd}
                disabled={effectiveStock === 0}
                className="flex-1 bg-emerald text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-emeraldDark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {effectiveStock === 0 ? 'Rupture de stock' : `Ajouter au panier — ${formatPrice(effectivePrice * qty)}`}
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
              {effectiveStock === 0 ? 'Épuisé — reviendra bientôt' : effectiveStock > 5 ? 'En stock' : `Plus que ${effectiveStock} exemplaires`}
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
