'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

/**
 * Grille 3 collections — Racine · Empreinte · Terre.
 * Chaque vignette : grande image portrait, label émeraude en-dessous.
 */
const tiles = [
  {
    name: 'Racine',
    tagline: 'Plaids · Coussins · Paniers · Chemins de table',
    href: '/collections?cat=racine',
    image: IMAGES.plaidBeige,
  },
  {
    name: 'Empreinte',
    tagline: 'Tapis · Macramé mural · Suspensions',
    href: '/collections?cat=empreinte',
    image: IMAGES.photMacrame,
  },
  {
    name: 'Terre',
    tagline: 'Poterie tournée main · Céramique',
    href: '/collections?cat=terre',
    image: IMAGES.terra,
  },
]

export default function CategoryTiles() {
  return (
    <section className="py-20 md:py-28 bg-ivory">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <span className="block text-[10px] uppercase tracking-[0.42em] text-emerald mb-4">Nos collections</span>
          <h2
            className="font-display text-4xl md:text-6xl leading-[1.02] text-balance text-emerald"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
          >
            Trois univers,<br className="hidden md:block"/> une même main.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {tiles.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={t.href} className="group block">
                <div className="aspect-[3/4] overflow-hidden bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-[1000ms] group-hover:scale-[1.04]"
                  />
                </div>
                <div className="pt-6 text-center">
                  <span className="block text-[10px] uppercase tracking-[0.42em] text-ink/50 mb-2">Collection</span>
                  <div
                    className="text-[26px] md:text-[32px] leading-none text-emerald group-hover:text-emeraldDark transition-colors"
                    style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
                  >
                    {t.name}
                  </div>
                  <p className="mt-3 text-[13px] text-ink/60 italic">{t.tagline}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
