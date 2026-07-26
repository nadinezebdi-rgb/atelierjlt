'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const cats = [
  { name: 'Sacs Crochet',       href: '/collections?cat=sacs',              image: 'https://customer-assets-7cd3h4nn.emergentagent.net/job_16983215-f483-48f9-9efe-e8baea0d1238/artifacts/3xwdj2zc_sacs%20crochet.jpeg', accent: 'brique',    span: 'lg:row-span-2 lg:col-span-2', h: 'h-[520px] lg:h-full' },
  { name: 'Pulls Crochet',      href: '/collections?cat=pulls',             image: '/api/img/pull-02',   accent: 'sable',      h: 'h-[300px]' },
  { name: 'Bougies',            href: '/collections?cat=bougies',           image: '/api/img/bougie-03', accent: 'terracotta', h: 'h-[300px]' },
  { name: 'Bijoux',             href: '/collections?cat=bijoux',            image: '/api/img/bijou-01',  accent: 'wood',       h: 'h-[300px]' },
  { name: 'Décoration',         href: '/collections?cat=decoration',        image: '/api/img/deco-02',   accent: 'plantes',    h: 'h-[300px]' },
  { name: 'Éditions limitées',  href: '/collections?cat=editions-limitees', image: '/api/img/plaid-03',  accent: 'brique',     h: 'h-[300px]', span: 'lg:col-span-2' },
]

export default function CategoryGrid() {
  return (
    <section className="py-20 md:py-32 bg-ivory">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-4">
          <div className="max-w-xl">
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Collections</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mt-4 text-balance">Une maison, plusieurs matières.</h2>
          </div>
          <p className="text-ink/60 md:max-w-sm leading-relaxed">
            Sacs crochetés main, pulls tricotés, bougies aux cristaux, bijoux discrets. Chaque catégorie est pensée comme une pièce de la maison.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {cats.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.08 }}
              className={c.span || ''}
            >
              <Link href={c.href} className={`group relative block overflow-hidden bg-cream ${c.h}`}>
                <div className={`absolute inset-x-0 top-0 h-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-${c.accent}`} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.image} alt={c.name} className="w-full h-full object-cover img-zoom" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <div className={`text-[10px] uppercase tracking-[0.28em] text-${c.accent === 'wood' ? 'sable' : c.accent === 'brique' ? 'sable' : 'ivory'}/90`}>Découvrir</div>
                  <div className="font-display text-2xl md:text-3xl text-ivory mt-1 leading-tight">{c.name}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
