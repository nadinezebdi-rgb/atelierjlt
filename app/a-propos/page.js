'use client'

import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

export default function AProposPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        {/* Hero — image plein cadre */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-ink">
          <motion.div
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={IMAGES.heroBeige || IMAGES.plaidBeige}
              alt="Atelier JLT — créations faites main"
              className="w-full h-full object-cover"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = '1'
                  e.currentTarget.src = IMAGES.plaidBeige || IMAGES.heroPlaid
                }
              }}
            />
            <div className="absolute inset-0 bg-ink/40" />
          </motion.div>
          <div className="relative h-full container flex items-end pb-14 md:pb-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.1, delay: 0.3 }}
              className="text-ivory max-w-2xl"
            >
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-ivory/80">À propos de nous</span>
              <h1
                className="mt-5 text-4xl md:text-7xl leading-[1] text-balance"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
              >
                Atelier JLT,<br />c'est quoi&nbsp;?
              </h1>
            </motion.div>
          </div>
        </section>

        {/* Texte — mise en page éditoriale */}
        <section className="container py-20 md:py-28 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1 }}
            className="space-y-7 text-[17px] md:text-lg leading-[1.75] text-ink/85"
          >
            <p className="first-letter:font-display first-letter:text-emerald first-letter:text-6xl first-letter:leading-none first-letter:float-left first-letter:mr-3 first-letter:mt-1">
              Atelier&nbsp;JLT, c'est une aventure artisanale née de mon amour pour la création et la décoration d'intérieur. J'imagine et confectionne à la main des pièces pensées pour apporter de la douceur, de la chaleur et du caractère à votre maison. Chaque création prend forme avec soin, amour et patience, au rythme des gestes et du travail de la matière.
            </p>

            <p>
              Basé en France, Atelier&nbsp;JLT possède aussi une âme nomade. Mes créations m'accompagnent dans les différents endroits où je voyage&nbsp;: un ouvrage commencé ici peut ainsi se poursuivre ailleurs, au fil de mes déplacements et de mes découvertes.
            </p>

            {/* Citation visuelle */}
            <blockquote className="relative my-12 md:my-16 py-10 border-y border-ink/15 text-center">
              <span
                className="block text-2xl md:text-3xl leading-[1.3] text-emerald italic"
                style={{ fontFamily: 'var(--font-display), serif', fontWeight: 400 }}
              >
                « Les paysages, les couleurs, les matières et les rencontres nourrissent mon imagination. »
              </span>
            </blockquote>

            <p>
              Mes voyages passés comme ceux en cours se retrouvent, par petites touches, dans les associations de teintes, les textures et les formes que je choisis.
            </p>

            <p>
              À travers Atelier&nbsp;JLT, je souhaite partager le plaisir des objets faits main, ceux auxquels on s'attache et qui trouvent naturellement leur place dans notre quotidien. De légères irrégularités peuvent témoigner du geste artisanal&nbsp;: elles font partie de l'histoire et du caractère de chaque pièce.
            </p>

            {/* Signature finale, plus intime */}
            <p className="pt-4 text-[17px] md:text-lg leading-[1.75] text-ink/85">
              Derrière chaque création, il y a mes mains, du temps, une idée qui a mûri… et parfois un petit bout de voyage à accueillir chez vous.
            </p>
          </motion.div>
        </section>

        {/* CTA découvrir les collections */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1 }}
          className="border-t border-linen"
        >
          <div className="container py-20 md:py-28 text-center max-w-2xl">
            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-5">Découvrir</span>
            <h2
              className="text-4xl md:text-6xl leading-[1.02] text-balance text-emerald mb-6"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Les créations de la maison.
            </h2>
            <p className="text-ink/60 italic mb-10 max-w-xl mx-auto">
              Chaque pièce est unique, imaginée et confectionnée à la main — plaids, coussins, paniers, macramés…
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/collections"
                className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] bg-ink text-ivory hover:bg-emerald transition-colors duration-500"
              >
                Voir les collections
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] border border-ink/25 text-ink hover:border-emerald hover:text-emerald transition-colors duration-500"
              >
                Nous écrire
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
