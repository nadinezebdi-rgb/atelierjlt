'use client'

import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import PageEditShell from '@/components/edit/page-edit-shell'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

const DEFAULT_IMAGE = IMAGES.heroBeige || IMAGES.plaidBeige

const DEFAULT_CONTENT = {
  heroImage: DEFAULT_IMAGE,
  heroImageAlt: 'Atelier JLT — créations faites main',
  heroEyebrow: 'À propos de nous',
  heroTitle: "Atelier JLT,\nc'est quoi ?",
  intro:
    "Atelier\u00a0JLT, c'est une aventure artisanale née de mon amour pour la création et la décoration d'intérieur. J'imagine et confectionne à la main des pièces pensées pour apporter de la douceur, de la chaleur et du caractère à votre maison. Chaque création prend forme avec soin, amour et patience, au rythme des gestes et du travail de la matière.",
  paragraph2:
    "Basé en France, Atelier\u00a0JLT possède aussi une âme nomade. Mes créations m'accompagnent dans les différents endroits où je voyage\u00a0: un ouvrage commencé ici peut ainsi se poursuivre ailleurs, au fil de mes déplacements et de mes découvertes.",
  quote:
    "« Les paysages, les couleurs, les matières et les rencontres nourrissent mon imagination. »",
  paragraph3:
    "Mes voyages passés comme ceux en cours se retrouvent, par petites touches, dans les associations de teintes, les textures et les formes que je choisis.",
  paragraph4:
    "À travers Atelier\u00a0JLT, je souhaite partager le plaisir des objets faits main, ceux auxquels on s'attache et qui trouvent naturellement leur place dans notre quotidien. De légères irrégularités peuvent témoigner du geste artisanal\u00a0: elles font partie de l'histoire et du caractère de chaque pièce.",
  signature:
    "Derrière chaque création, il y a mes mains, du temps, une idée qui a mûri… et parfois un petit bout de voyage à accueillir chez vous.",
  ctaEyebrow: 'Découvrir',
  ctaTitle: 'Les créations de la maison.',
  ctaDescription:
    'Chaque pièce est unique, imaginée et confectionnée à la main — plaids, coussins, paniers, macramés…',
  ctaButton1Label: 'Voir les collections',
  ctaButton1Href: '/collections',
  ctaButton2Label: 'Nous écrire',
  ctaButton2Href: '/contact',
}

const EDIT_FIELDS = [
  { key: 'heroImage', type: 'image', label: 'Image du hero' },
  { key: 'heroImageAlt', type: 'text', label: 'Texte alternatif (SEO)' },
  { key: 'heroEyebrow', type: 'text', label: 'Petit texte (sur-titre)' },
  { key: 'heroTitle', type: 'textarea', label: 'Grand titre (saut de ligne autorisé)' },
  { key: 'intro', type: 'longtext', label: 'Paragraphe d\u2019introduction' },
  { key: 'paragraph2', type: 'longtext', label: 'Paragraphe 2' },
  { key: 'quote', type: 'textarea', label: 'Citation' },
  { key: 'paragraph3', type: 'longtext', label: 'Paragraphe 3' },
  { key: 'paragraph4', type: 'longtext', label: 'Paragraphe 4' },
  { key: 'signature', type: 'longtext', label: 'Signature finale' },
  { key: 'ctaEyebrow', type: 'text', label: 'CTA — Petit texte' },
  { key: 'ctaTitle', type: 'textarea', label: 'CTA — Grand titre' },
  { key: 'ctaDescription', type: 'textarea', label: 'CTA — Description' },
  { key: 'ctaButton1Label', type: 'text', label: 'Bouton 1 — texte' },
  { key: 'ctaButton1Href', type: 'text', label: 'Bouton 1 — lien' },
  { key: 'ctaButton2Label', type: 'text', label: 'Bouton 2 — texte' },
  { key: 'ctaButton2Href', type: 'text', label: 'Bouton 2 — lien' },
]

export default function AProposPage() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const about = d?.content?.about || {}
        setContent({ ...DEFAULT_CONTENT, ...about })
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
    return () => { cancelled = true }
  }, [])

  const c = content

  return (
    <div className="min-h-screen bg-ivory">
      <PageEditShell
        pageKey="about"
        initialContent={content}
        fields={EDIT_FIELDS}
        onChange={setContent}
      />

      <Header />
      <main>
        {/* Hero — image plein cadre */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-ink">
          <motion.div
            key={c.heroImage}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.heroImage || DEFAULT_IMAGE}
              alt={c.heroImageAlt || DEFAULT_CONTENT.heroImageAlt}
              className="w-full h-full object-cover"
              onError={(e) => {
                if (!e.currentTarget.dataset.fallback) {
                  e.currentTarget.dataset.fallback = '1'
                  e.currentTarget.src = DEFAULT_IMAGE
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
              <span className="text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-ivory/80">
                {c.heroEyebrow}
              </span>
              <h1
                className="mt-5 text-4xl md:text-7xl leading-[1] text-balance whitespace-pre-line"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
              >
                {c.heroTitle}
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
            <p className="first-letter:font-display first-letter:text-emerald first-letter:text-6xl first-letter:leading-none first-letter:float-left first-letter:mr-3 first-letter:mt-1 whitespace-pre-line">
              {c.intro}
            </p>

            <p className="whitespace-pre-line">{c.paragraph2}</p>

            {c.quote && (
              <blockquote className="relative my-12 md:my-16 py-10 border-y border-ink/15 text-center">
                <span
                  className="block text-2xl md:text-3xl leading-[1.3] text-emerald italic whitespace-pre-line"
                  style={{ fontFamily: 'var(--font-display), serif', fontWeight: 400 }}
                >
                  {c.quote}
                </span>
              </blockquote>
            )}

            <p className="whitespace-pre-line">{c.paragraph3}</p>
            <p className="whitespace-pre-line">{c.paragraph4}</p>

            {c.signature && (
              <p className="pt-4 text-[17px] md:text-lg leading-[1.75] text-ink/85 whitespace-pre-line">
                {c.signature}
              </p>
            )}
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
            {c.ctaEyebrow && (
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-5">
                {c.ctaEyebrow}
              </span>
            )}
            {c.ctaTitle && (
              <h2
                className="text-4xl md:text-6xl leading-[1.02] text-balance text-emerald mb-6 whitespace-pre-line"
                style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
              >
                {c.ctaTitle}
              </h2>
            )}
            {c.ctaDescription && (
              <p className="text-ink/60 italic mb-10 max-w-xl mx-auto whitespace-pre-line">
                {c.ctaDescription}
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-4">
              {c.ctaButton1Label && c.ctaButton1Href && (
                <Link
                  href={c.ctaButton1Href}
                  className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] bg-ink text-ivory hover:bg-emerald transition-colors duration-500"
                >
                  {c.ctaButton1Label}
                </Link>
              )}
              {c.ctaButton2Label && c.ctaButton2Href && (
                <Link
                  href={c.ctaButton2Href}
                  className="inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] border border-ink/25 text-ink hover:border-emerald hover:text-emerald transition-colors duration-500"
                >
                  {c.ctaButton2Label}
                </Link>
              )}
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
