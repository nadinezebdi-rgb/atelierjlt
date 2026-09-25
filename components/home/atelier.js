'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

export default function Atelier() {
  return (
    <section className="py-20 md:py-32 bg-linen/50">
      <div className="container grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={IMAGES.atelier} alt="Notre atelier" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Notre Atelier</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mt-5 text-balance">
            Le temps, la main, la matière.
          </h2>
          <div className="mt-6 space-y-4 text-ink/70 leading-relaxed max-w-lg">
            <p>
              Nos créations naissent dans un ancien mas drômois, entre l'odeur du bois et le silence du crochet.
              Nous travaillons lentement, volontairement.
            </p>
            <p>
              Un sac réclame vingt heures. Une couverture, trente. Un vase, plusieurs cuissons.
              Ce sont ces heures qui rendent chaque pièce unique.
            </p>
          </div>
          <Link
            href="/atelier"
            className="group inline-flex items-center gap-3 mt-10 border border-sable text-ink px-8 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-sable hover:text-ink transition-colors duration-500"
          >
            Entrer dans l'atelier
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
