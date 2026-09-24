'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

/**
 * Explorer par collection — signature magazine.
 * Chaque bloc = grande image + label "Collection" + nom + phrase +
 * sous-liens de sous-catégories (produits inclus).
 */
const themes = [
  {
    name: 'Racine',
    tagline: 'Les tissages du foyer — plaids, coussins et paniers noués à la main pour envelopper et adoucir.',
    image: IMAGES.plaidBeige,
    links: [
      { label: 'Plaids',            href: '/collections?cat=racine' },
      { label: 'Coussins',          href: '/collections?cat=racine' },
      { label: 'Paniers',           href: '/collections?cat=racine' },
      { label: 'Chemins de table',  href: '/collections?cat=racine' },
    ],
  },
  {
    name: 'Empreinte',
    tagline: 'Les traces qui habillent les murs — tapis, macramés et suspensions comme des signatures textiles.',
    image: IMAGES.photMacrame,
    links: [
      { label: 'Tapis',             href: '/collections?cat=empreinte' },
      { label: 'Macramé mural',     href: '/collections?cat=empreinte' },
      { label: 'Suspensions',       href: '/collections?cat=empreinte' },
    ],
  },
  {
    name: 'Terre',
    tagline: 'La poterie tournée à la main — chaque pièce garde la mémoire du geste.',
    image: IMAGES.terra,
    links: [
      { label: 'Vases',             href: '/collections?cat=terre' },
      { label: 'Bols & Coupes',     href: '/collections?cat=terre' },
      { label: 'Photophores',       href: '/collections?cat=terre' },
    ],
  },
]

export default function CollectionsThemes() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <span className="block text-[10px] uppercase tracking-[0.42em] text-emerald mb-4">Explorez par univers</span>
          <h2
            className="text-4xl md:text-6xl leading-[1.02] text-balance text-emerald"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
          >
            Trois collections,<br className="hidden md:block"/> un seul atelier.
          </h2>
        </div>

        <div className="space-y-16 md:space-y-24">
          {themes.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
              className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center ${i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''}`}
            >
              <Link href={t.links[0].href} className="md:col-span-7 block group">
                <div className="aspect-[5/6] md:aspect-[4/3] overflow-hidden bg-ivory">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.03]"
                  />
                </div>
              </Link>

              <div className="md:col-span-5">
                <span className="block text-[10px] uppercase tracking-[0.42em] text-emerald mb-4">Collection · 0{i + 1}</span>
                <h3
                  className="text-5xl md:text-7xl leading-[1] text-emerald mb-6"
                  style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
                >
                  {t.name}
                </h3>
                <p className="text-base md:text-lg text-ink/70 italic leading-relaxed max-w-md">
                  {t.tagline}
                </p>
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                  {t.links.map((l) => (
                    <Link
                      key={l.label}
                      href={l.href}
                      className="text-[11px] uppercase tracking-[0.28em] text-ink/70 hover:text-emerald transition-colors border-b border-transparent hover:border-emerald pb-0.5"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
                <Link
                  href={t.links[0].href}
                  className="mt-10 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-emerald hover:text-emeraldDark transition-colors"
                >
                  Découvrir la collection →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
