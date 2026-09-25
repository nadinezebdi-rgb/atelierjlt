'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

/**
 * Hero — mise en page 2 colonnes (texte gauche · image droite) sur desktop,
 * empilé sur mobile. Détecte automatiquement une vidéo (.mp4/.webm/.mov)
 * et l'affiche à la place de l'image statique.
 */
export default function HeroFerm({ media, eyebrow, title, subtitle, ctaPrimary, ctaSecondary, signature }) {
  const mediaUrl = media || IMAGES.heroBeige
  const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl) || mediaUrl.includes('/api/file/') && /\.(mp4|webm|mov)/i.test(mediaUrl)
  const heroEyebrow = eyebrow || 'Nouvelle Collection · Automne-Hiver 2025'
  const heroTitle = title || 'L’art discret\nde la maison.'
  const heroSubtitle = subtitle || 'Plaids crochet, macramé mural, poterie tournée main — chaque pièce imaginée, fabriquée et assemblée à la main dans notre atelier français.'
  const cta1 = ctaPrimary || { label: 'Découvrir la collection', href: '/collections?cat=nouveautes' }
  const cta2 = ctaSecondary || { label: 'Notre atelier', href: '/atelier' }
  const sig = signature || 'Plaid Sylvestre · Crochet main'
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
            {heroEyebrow}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-[46px] leading-[1] md:text-[80px] lg:text-[92px] md:leading-[0.95] text-balance whitespace-pre-line"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400, color: '#0F5C3F' }}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 md:mt-8 text-base md:text-lg text-ink/70 leading-relaxed"
          >
            {heroSubtitle}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-9 md:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            {cta1?.href && cta1?.label && (
              <Link
                href={cta1.href}
                className="group inline-flex items-center justify-center gap-3 bg-emerald text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emeraldDark transition-colors duration-500"
              >
                {cta1.label}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
              </Link>
            )}
            {cta2?.href && cta2?.label && (
              <Link
                href={cta2.href}
                className="inline-flex items-center justify-center gap-3 border border-emerald text-emerald px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emerald hover:text-ivory transition-colors duration-500"
              >
                {cta2.label}
              </Link>
            )}
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

        {/* Colonne média — image ou vidéo */}
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5] w-full overflow-hidden bg-cream"
        >
          {isVideo ? (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              aria-label="Vidéo d'ambiance Atelier JLT"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mediaUrl}
              alt="Salon crème avec plaid beige chunky — Atelier JLT"
              className="w-full h-full object-cover"
            />
          )}
          {/* Petite étiquette signature en bas d'image */}
          {sig && (
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-ivory/90 backdrop-blur px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-emerald">
              {sig}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
