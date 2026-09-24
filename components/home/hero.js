'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

export default function Hero() {
  return (
    <section className="relative h-[92vh] min-h-[640px] w-full overflow-hidden bg-ink">
      {/* Background image with subtle parallax */}
      <motion.div
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={IMAGES.interior1}
          alt="Intérieur Atelier JLT"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/85 via-ink/25 to-ink/75" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-ink/70 to-transparent" />
      </motion.div>

      <div className="relative h-full container flex flex-col justify-end pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl text-ivory"
        >
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.36em] text-ivory/80">
            Maison française · depuis 2019
          </span>
          <h1 className="font-display font-bold text-[44px] leading-[1.02] md:text-[76px] md:leading-[0.98] mt-5 text-balance">
            Les objets qui donnent
            <br />
            une <em className="not-italic text-terracotta">âme</em> à votre intérieur.
          </h1>
          <p className="mt-6 md:mt-8 text-base md:text-lg text-ivory/85 max-w-xl leading-relaxed">
            Chaque création Atelier JLT est imaginée, fabriquée et assemblée à la main.
            Une maison de décoration, pas une simple boutique.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/collections"
              className="group inline-flex items-center justify-center gap-3 bg-ivory text-ink px-8 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta hover:text-ivory transition-colors duration-500"
            >
              Découvrir la collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </Link>
            <Link
              href="/histoire"
              className="inline-flex items-center justify-center gap-3 border border-ivory/70 text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-ivory hover:text-ink transition-colors duration-500"
            >
              Notre histoire
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="hidden md:block absolute bottom-8 right-8 text-ivory/60 text-[10px] uppercase tracking-[0.36em] rotate-90 origin-bottom-right"
      >
        défiler
      </motion.div>
    </section>
  )
}
