'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'
import { useCart } from './cart-provider'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export default function ProductCard({ product, index = 0 }) {
  const { add } = useCart()

  const handleAdd = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    await add(product.slug, 1)
    toast.success(`${product.name} ajouté au panier`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: (index % 4) * 0.08 }}
      className="group"
    >
      <Link href={`/produit/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover img-zoom"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-ivory/95 text-ink text-[10px] uppercase tracking-[0.22em] px-2.5 py-1">Nouveau</span>
            )}
            {product.isLimited && (
              <span className="bg-terracotta text-ivory text-[10px] uppercase tracking-[0.22em] px-2.5 py-1">Édition limitée</span>
            )}
          </div>
          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); toast('Ajouté aux favoris') }}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-ivory/85 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Ajouter aux favoris"
          >
            <Heart className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          {/* Quick add */}
          <div className="absolute inset-x-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
            <button
              onClick={handleAdd}
              className="w-full bg-ivory text-ink py-3 text-[10px] uppercase tracking-[0.28em] hover:bg-ink hover:text-ivory transition-colors"
            >
              Ajout rapide au panier
            </button>
          </div>
        </div>
        <div className="pt-4 flex items-start justify-between gap-3">
          <div>
            <div className="font-display text-[17px] leading-snug">{product.name}</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50 mt-1">{product.material}</div>
          </div>
          <div className="font-display text-[17px] tabular-nums whitespace-nowrap">{formatPrice(product.price)}</div>
        </div>
      </Link>
    </motion.div>
  )
}
