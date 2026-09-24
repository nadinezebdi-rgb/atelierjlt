'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

/**
 * Hero — mise en page 2 colonnes (texte gauche · image droite) sur desktop,
 * empilé sur mobile. Aucune superposition avec le header : le texte respire,
 * l'image reste entièrement visible.
 */
export default function HeroFerm() {
  return (
    <section className="relative bg-ivory">
      <div className="container grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 py-10 md:py-16 lg:py-20 items-center">
        {/* Colonne texte */}
        <div className="max-w-xl">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-5"
          >
            Nouvelle Collection · Automne-Hiver 2025
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[46px] leading-[1] md:text-[80px] lg:text-[92px] md:leading-[0.95] text-balance"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400, color: '#0F5C3F' }}
          >
            L’art discret<br/>de la maison.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 md:mt-8 text-base md:text-lg text-ink/70 leading-relaxed"
          >
            Plaids crochet, macramé mural, poterie tournée main — chaque pièce imaginée, fabriquée et assemblée à la main dans notre atelier français.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-9 md:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <Link
              href="/collections?cat=nouveautes"
              className="group inline-flex items-center justify-center gap-3 bg-emerald text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emeraldDark transition-colors duration-500"
            >
              Découvrir la collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </Link>
            <Link
              href="/atelier"
              className="inline-flex items-center justify-center gap-3 border border-emerald text-emerald px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emerald hover:text-ivory transition-colors duration-500"
            >
              Notre atelier
            </Link>
          </motion.div>

          {/* Micro-argu sous les CTA */}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.24em] text-ink/50">
            <span>Fabrication française</span>
            <span>·</span>
            <span>Livraison offerte dès 150 €</span>
            <span>·</span>
            <span>Emballage soigné</span>
          </div>
        </div>

        {/* Colonne image — l’image est totalement visible, pas de voile */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5] w-full overflow-hidden bg-cream"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={IMAGES.heroBeige}
            alt="Salon crème avec plaid beige chunky — Atelier JLT"
            className="w-full h-full object-cover"
          />
          {/* Petite étiquette signature en bas d'image */}
          <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-ivory/90 backdrop-blur px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-emerald">
            Plaid Sylvestre · Crochet main
          </div>
        </motion.div>
      </div>
    </section>
  )
}
