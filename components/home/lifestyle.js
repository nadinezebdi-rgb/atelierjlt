'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function Lifestyle() {
  return (
    <section className="py-20 md:py-32 bg-cream/40 overflow-hidden">
      <div className="container grid md:grid-cols-12 gap-8 md:gap-14 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-5 md:pr-4"
        >
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Scène de vie</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl leading-[1.05] mt-5 text-balance">
            Un dimanche matin, la lumière tombe sur le lin.
          </h2>
          <div className="mt-6 space-y-4 text-ink/70 leading-relaxed max-w-md">
            <p>
              Le Plaid Sylvestre, deux coussins ronds crochetés — l'un écru, l'autre bordeaux — posés
              sur un bois brut. Rien de plus. C'est ainsi que nos pièces vivent chez nous : peu, mais bien.
            </p>
            <p className="italic text-ink/60">
              « Nous choisissons ce que nous voulons voir chaque jour, longtemps. »
            </p>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/produit/plaid-sylvestre"
              className="group inline-flex items-center gap-3 bg-ink text-ivory px-7 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors duration-500"
            >
              Le Plaid Sylvestre
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
            </Link>
            <Link
              href="/collections?cat=decoration"
              className="inline-flex items-center gap-3 border border-sable text-ink px-7 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-sable hover:text-ink transition-colors duration-500"
            >
              Voir les coussins
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="md:col-span-7 relative"
        >
          <div className="relative aspect-square overflow-hidden bg-cream shadow-[0_40px_100px_-40px_rgba(20,18,16,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/img/lifestyle-plaid"
              alt="Plaid Sylvestre et coussins crochet dans une chambre lumineuse"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.9 }}
            className="hidden md:block absolute -bottom-6 -left-6 bg-ivory px-6 py-5 max-w-xs shadow-[0_20px_50px_-20px_rgba(20,18,16,0.25)]"
          >
            <div className="text-[10px] uppercase tracking-[0.32em] text-terracotta">Édition limitée</div>
            <div className="font-display text-xl mt-1 leading-tight">Plaid Sylvestre + duo de coussins</div>
            <div className="text-sm text-ink/60 mt-2 tabular-nums">à partir de 118 €</div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
