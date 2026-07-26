'use client'

import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

const photos = [
  '/api/img/deco-02',
  '/api/img/pull-02',
  '/api/img/bougie-03',
  '/api/img/plaid-01',
  '/api/img/bijou-02',
  '/api/img/deco-01',
]

export default function InstagramGrid() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-12">
          <Instagram className="h-5 w-5 mx-auto text-terracotta" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-3xl md:text-4xl mt-4">@ginette.creations</h2>
          <p className="text-ink/60 text-sm mt-3">Nos créations dans de vrais intérieurs.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {photos.map((src, i) => (
            <motion.a
              key={i}
              href="#"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.05 }}
              className="group aspect-square overflow-hidden bg-cream block relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover img-zoom" />
              <div className="absolute inset-0 bg-ink/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <Instagram className="h-6 w-6 text-ivory" strokeWidth={1.2} />
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
