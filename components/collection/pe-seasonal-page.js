'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

/**
 * Page de la collection Printemps / Été 2026-2027 — Atelier JLT.
 *
 * Composition :
 *   1. Hero plein cadre (image florale, titre serif, surtitre)
 *   2. Bloc Ambiance (image côté + texte) — doux, chaleureux, bien chez soi
 *   3. Bloc Palette (5 pastilles de couleur étiquetées)
 *   4. Bloc Matières (grille de 4 cartes image + nom)
 *   5. Bloc Produits de la collection (si des produits existent)
 *   6. CTA de retour vers "Les Intemporels"
 *
 * Tout le contenu (hero, ambiance, palette, matières) est éditable depuis
 * `/admin → Éditeur de l'accueil → Collection Printemps / Été 2026-2027`.
 */
export default function PESeasonalPage({ content, products }) {
  return (
    <main>
      {/* ===== 1. HERO ===== */}
      <section className="relative h-[80vh] min-h-[560px] overflow-hidden bg-ink">
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.heroImage}
            alt={content.heroTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-ink/15 to-ink/55" />
        </motion.div>
        <div className="relative h-full container flex items-end pb-14 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.3 }}
            className="text-ivory max-w-3xl"
          >
            <span className="text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-ivory/85">
              {content.heroEyebrow}
            </span>
            <h1
              className="mt-5 text-5xl md:text-8xl leading-[0.95] text-balance"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              {content.heroTitle}
            </h1>
            {content.heroSubtitle && (
              <p className="mt-6 text-base md:text-xl text-ivory/90 italic max-w-xl">
                {content.heroSubtitle}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ===== 2. AMBIANCE ===== */}
      <section className="container py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1 }}
            className="order-2 md:order-1"
          >
            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-4">
              {content.moodEyebrow}
            </span>
            <h2
              className="text-3xl md:text-5xl leading-[1.05] text-balance text-ink mb-6 whitespace-pre-line"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              {content.moodTitle}
            </h2>
            <p className="text-ink/80 text-base md:text-lg leading-[1.75]">{content.moodText}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1 }}
            className="order-1 md:order-2 relative aspect-[4/5] overflow-hidden bg-linen"
          >
            {content.moodImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={content.moodImage}
                alt="Ambiance Printemps / Été"
                className="w-full h-full object-cover"
              />
            ) : null}
          </motion.div>
        </div>
      </section>

      {/* ===== 3. PALETTE ===== */}
      {content.palette?.length > 0 && (
        <section className="bg-cream/40 py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1 }}
              className="text-center max-w-xl mx-auto mb-12 md:mb-16"
            >
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-3">
                La palette
              </span>
              <h2
                className="text-3xl md:text-5xl leading-[1.05] text-ink"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
              >
                Cinq couleurs,<br />une saison.
              </h2>
            </motion.div>
            <div className="grid grid-cols-5 gap-3 md:gap-5 max-w-4xl mx-auto">
              {content.palette.map((c, i) => (
                <motion.div
                  key={c.hex + i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="text-center"
                >
                  <div
                    className="aspect-square mb-3 md:mb-5 rounded-sm shadow-sm"
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name} — ${c.hex}`}
                  />
                  <p className="text-[10px] md:text-xs uppercase tracking-[0.22em] text-ink/70 leading-tight">
                    {c.name}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== 4. MATIÈRES ===== */}
      {content.materials?.length > 0 && (
        <section className="container py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1 }}
            className="text-center max-w-xl mx-auto mb-12 md:mb-16"
          >
            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-3">
              Les matières
            </span>
            <h2
              className="text-3xl md:text-5xl leading-[1.05] text-ink"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Fils fins et cordons tressés.
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {content.materials.map((m, i) => (
              <motion.div
                key={(m.name || '') + i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div className="relative aspect-square overflow-hidden bg-linen mb-4">
                  {m.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-ink/80 text-center">
                  {m.name}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ===== 5. PRODUITS DE LA COLLECTION ===== */}
      {products.length > 0 ? (
        <section className="bg-cream/40 py-20 md:py-28">
          <div className="container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1 }}
              className="text-center max-w-xl mx-auto mb-12 md:mb-16"
            >
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-3">
                Les pièces
              </span>
              <h2
                className="text-3xl md:text-5xl leading-[1.05] text-ink"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
              >
                La collection.
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-8">
              {products.map((p) => (
                <Link key={p.slug} href={`/produit/${p.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-ivory mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images?.[0]}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="font-display text-lg leading-tight text-ink">{p.name}</div>
                  <div className="text-sm text-ink/60 mt-1">{p.price?.toFixed(2)} €</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : (
        // Teasing — produits à venir
        <section className="bg-cream/40 py-20 md:py-28">
          <div className="container max-w-xl text-center">
            <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-3">
              Bientôt
            </span>
            <h2
              className="text-3xl md:text-5xl leading-[1.05] text-ink mb-5"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Les pièces arrivent.
            </h2>
            <p className="text-ink/70 italic leading-relaxed">
              Les créations de la collection Printemps / Été 2026-2027 vous seront dévoilées très bientôt. Inscrivez-vous à la newsletter pour les découvrir en avant-première.
            </p>
          </div>
        </section>
      )}

      {/* ===== 6. CTA retour aux Intemporels ===== */}
      <section className="border-t border-linen">
        <div className="container py-16 md:py-20 text-center max-w-xl">
          <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-4">
            En attendant
          </span>
          <h2
            className="text-2xl md:text-4xl leading-[1.1] text-ink mb-6"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
          >
            Les Intemporels de la maison.
          </h2>
          <Link
            href="/collections?cat=intemporels"
            className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] bg-ink text-ivory hover:bg-emerald transition-colors duration-500 rounded-sm"
          >
            Découvrir <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </main>
  )
}
