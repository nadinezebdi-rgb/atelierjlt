'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const scenes = [
  {
    src: '/api/img/lifestyle-plaid',
    label: 'La chambre',
    caption: 'Plaid Sylvestre & coussins ronds sur un bois brut, la lumière du matin.',
    tag: 'Chambre · Édition Minérale',
    cta: '/produit/plaid-sylvestre',
    ctaLabel: 'Voir le plaid',
  },
  {
    src: '/api/img/ambiance-lin',
    label: 'Le salon linéaire',
    caption: 'Canapé lin naturel, plaid vert mousse, duo de vases crochet écru & bordeaux.',
    tag: 'Salon · Édition Rivage',
    cta: '/collections?cat=decoration',
    ctaLabel: 'Voir la décoration',
  },
  {
    src: '/api/img/ambiance-canape',
    label: 'Le salon vintage',
    caption: "Cuir patiné, plaid Sylvestre, coussins texturés. L'âme d'une pièce vécue.",
    tag: 'Salon · Édition Héritage',
    cta: '/collections?collection=heritage',
    ctaLabel: 'Collection Héritage',
  },
]

export default function ChezGinette() {
  const [i, setI] = useState(0)
  const next = () => setI((v) => (v + 1) % scenes.length)
  const prev = () => setI((v) => (v - 1 + scenes.length) % scenes.length)
  const s = scenes[i]

  return (
    <section className="py-20 md:py-28 bg-plantes text-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Chez Ginette</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">Trois pièces, une même main.</h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={prev} aria-label="Précédent" className="h-11 w-11 rounded-full border border-ivory/25 hover:border-terracotta hover:text-terracotta transition flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button onClick={next} aria-label="Suivant" className="h-11 w-11 rounded-full border border-ivory/25 hover:border-terracotta hover:text-terracotta transition flex items-center justify-center">
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
          <motion.div
            key={s.src}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="md:col-span-8 relative aspect-square md:aspect-[4/3] overflow-hidden bg-plantes/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.label} className="w-full h-full object-cover" />
          </motion.div>

          <div className="md:col-span-4">
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15 }}
            >
              <div className="text-[10px] uppercase tracking-[0.32em] text-terracotta">{s.tag}</div>
              <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight">{s.label}</h3>
              <p className="mt-4 text-ivory/70 leading-relaxed">{s.caption}</p>
              <Link
                href={s.cta}
                className="inline-block mt-8 border-b border-ivory pb-1 text-[11px] uppercase tracking-[0.28em] hover:text-terracotta hover:border-terracotta transition-colors"
              >
                {s.ctaLabel} →
              </Link>
            </motion.div>

            {/* Thumbnails */}
            <div className="mt-10 flex gap-3">
              {scenes.map((sc, idx) => (
                <button
                  key={sc.src}
                  onClick={() => setI(idx)}
                  className={`relative flex-1 aspect-square overflow-hidden transition-opacity ${idx === i ? 'ring-2 ring-terracotta ring-offset-4 ring-offset-plantes' : 'opacity-60 hover:opacity-100'}`}
                  aria-label={`Voir ${sc.label}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={sc.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Mobile controls */}
            <div className="md:hidden mt-6 flex items-center justify-between">
              <button onClick={prev} className="text-[11px] uppercase tracking-[0.28em] flex items-center gap-2"><ChevronLeft className="h-4 w-4" />Préc.</button>
              <div className="text-[11px] tabular-nums text-ivory/50">{i + 1} / {scenes.length}</div>
              <button onClick={next} className="text-[11px] uppercase tracking-[0.28em] flex items-center gap-2">Suiv.<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
