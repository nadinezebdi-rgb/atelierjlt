'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { COLLECTIONS, IMAGES } from '@/lib/data/products'

const covers = ['/products/plaid-03.jpeg', '/products/bougie-03.jpeg', '/products/deco-02.jpeg', '/products/pull-01.jpeg', '/products/bijou-02.jpeg', '/products/deco-01.jpeg']

export default function CollectionsShowcase() {
  return (
    <section className="py-20 md:py-32 bg-ivory">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Nos collections</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">Six récits, une même main.</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {COLLECTIONS.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.9, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/collections?collection=${c.slug}`} className="group block">
                <div className="aspect-[3/4] overflow-hidden bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={covers[i % covers.length]} alt={c.name} className="w-full h-full object-cover img-zoom" />
                </div>
                <div className="pt-4">
                  <div className="font-display text-lg md:text-xl leading-snug">{c.name}</div>
                  <div className="text-sm text-ink/60 mt-1 italic">{c.story}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
