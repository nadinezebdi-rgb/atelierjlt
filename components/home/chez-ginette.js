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

// Botanical SVG leaves used as decorative flourishes on the light background
function LeafSprig({ className = '', flip = false }) {
  return (
    <svg
      viewBox="0 0 220 320"
      className={className}
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="leafGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#5B7A4A" />
          <stop offset="100%" stopColor="#3F5B32" />
        </linearGradient>
      </defs>
      {/* central stem */}
      <path d="M110 320 C 105 220, 115 130, 108 20" stroke="#3F5B32" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* leaves along the stem */}
      <g fill="url(#leafGrad)">
        <path d="M108 280 C 60 268, 40 240, 30 210 C 65 220, 95 245, 108 280 Z" />
        <path d="M108 240 C 155 232, 180 208, 190 178 C 155 188, 125 210, 108 240 Z" />
        <path d="M108 200 C 55 195, 32 172, 22 140 C 60 148, 92 168, 108 200 Z" />
        <path d="M108 160 C 155 155, 178 132, 188 100 C 152 108, 122 130, 108 160 Z" />
        <path d="M108 120 C 62 118, 40 95, 32 62 C 68 72, 96 92, 108 120 Z" />
        <path d="M108 82 C 145 78, 168 55, 178 22 C 148 32, 122 52, 108 82 Z" />
        <path d="M108 46 C 82 40, 68 24, 62 6 C 82 12, 98 26, 108 46 Z" />
      </g>
    </svg>
  )
}

function SingleLeaf({ className = '' }) {
  return (
    <svg viewBox="0 0 200 320" className={className} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="singleLeafGrad" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#7A9463" />
          <stop offset="100%" stopColor="#3F5B32" />
        </linearGradient>
      </defs>
      <path
        d="M100 10 C 30 60, 15 180, 100 310 C 185 180, 170 60, 100 10 Z"
        fill="url(#singleLeafGrad)"
      />
      <path
        d="M100 20 L 100 300"
        stroke="#2E4425"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Veins */}
      <path d="M100 60 C 130 80, 145 110, 155 130" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M100 60 C 70 80, 55 110, 45 130" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M100 120 C 130 140, 145 170, 155 190" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M100 120 C 70 140, 55 170, 45 190" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M100 180 C 125 200, 138 220, 145 240" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
      <path d="M100 180 C 75 200, 62 220, 55 240" stroke="#2E4425" strokeWidth="1" fill="none" opacity="0.6" />
    </svg>
  )
}

export default function ChezGinette() {
  const [i, setI] = useState(0)
  const next = () => setI((v) => (v + 1) % scenes.length)
  const prev = () => setI((v) => (v - 1 + scenes.length) % scenes.length)
  const s = scenes[i]

  return (
    <section className="relative py-20 md:py-32 bg-ivory overflow-hidden">
      {/* Decorative botanical flourishes */}
      <motion.div
        initial={{ opacity: 0, x: -40, rotate: -10 }}
        whileInView={{ opacity: 0.85, x: 0, rotate: -8 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -left-16 -top-10 w-[220px] md:w-[300px] hidden md:block"
      >
        <LeafSprig className="w-full h-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40, rotate: 12 }}
        whileInView={{ opacity: 0.7, x: 0, rotate: 15 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -right-14 top-40 w-[180px] md:w-[240px] hidden md:block"
      >
        <LeafSprig className="w-full h-auto" flip />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60, rotate: 25 }}
        whileInView={{ opacity: 0.65, y: 0, rotate: 30 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute -bottom-12 -right-6 w-[140px] md:w-[200px]"
      >
        <SingleLeaf className="w-full h-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -20 }}
        whileInView={{ opacity: 0.55, y: 0, rotate: -18 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute bottom-10 -left-6 w-[120px] md:w-[170px]"
      >
        <SingleLeaf className="w-full h-auto" />
      </motion.div>

      <div className="container relative z-10">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-plantes">Chez Ginette</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">Trois pièces, une même main.</h2>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button onClick={prev} aria-label="Précédent" className="h-11 w-11 rounded-full border border-ink/20 hover:border-plantes hover:text-plantes transition flex items-center justify-center">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button onClick={next} aria-label="Suivant" className="h-11 w-11 rounded-full border border-ink/20 hover:border-plantes hover:text-plantes transition flex items-center justify-center">
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
            className="md:col-span-8 relative aspect-square md:aspect-[4/3] overflow-hidden bg-cream shadow-[0_40px_100px_-40px_rgba(20,18,16,0.25)]"
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
              <div className="text-[10px] uppercase tracking-[0.32em] text-plantes">{s.tag}</div>
              <h3 className="font-display text-3xl md:text-4xl mt-3 leading-tight text-ink">{s.label}</h3>
              <p className="mt-4 text-ink/70 leading-relaxed">{s.caption}</p>
              <Link
                href={s.cta}
                className="inline-block mt-8 border-b border-ink pb-1 text-[11px] uppercase tracking-[0.28em] hover:text-plantes hover:border-plantes transition-colors"
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
                  className={`relative flex-1 aspect-square overflow-hidden transition-opacity ${idx === i ? 'ring-2 ring-plantes ring-offset-4 ring-offset-ivory' : 'opacity-60 hover:opacity-100'}`}
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
              <div className="text-[11px] tabular-nums text-ink/50">{i + 1} / {scenes.length}</div>
              <button onClick={next} className="text-[11px] uppercase tracking-[0.28em] flex items-center gap-2">Suiv.<ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
