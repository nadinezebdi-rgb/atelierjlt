'use client'

import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import PageEditShell from '@/components/edit/page-edit-shell'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'
import { ABOUT_DEFAULTS, ABOUT_FIELDS } from '@/lib/page-content-config'

const DEFAULT_IMAGE = IMAGES.heroBeige || IMAGES.plaidBeige

const DEFAULT_CONTENT = ABOUT_DEFAULTS
const EDIT_FIELDS = ABOUT_FIELDS

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
        label="À propos"
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
