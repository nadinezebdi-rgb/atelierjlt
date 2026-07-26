'use client'

import { motion } from 'framer-motion'
import { Hammer, Flag, Sprout, Diamond, Gift } from 'lucide-react'

const items = [
  { icon: Hammer, title: 'Fabrication artisanale', text: 'Chaque pièce prend forme dans nos mains, pas en série.', color: 'text-terracotta' },
  { icon: Flag,   title: 'Créations françaises',   text: 'Atelier basé dans la Drôme. Made in France assumé.', color: 'text-brique' },
  { icon: Sprout, title: 'Matières sélectionnées', text: 'Coton recyclé, grès, laines nobles, bois massifs.', color: 'text-plantes' },
  { icon: Diamond,title: 'Pièces uniques',         text: 'Aucune création n\u2019est parfaitement identique.', color: 'text-sable' },
  { icon: Gift,   title: 'Emballage soigné',       text: 'Un rituel de déballage pensé pour être gardé.', color: 'text-terracotta' },
]

export default function WhyGinette() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Pourquoi Ginette ?</span>
          <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">Le luxe discret du travail bien fait.</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="text-center px-2"
            >
              <div className="h-12 w-12 rounded-full bg-ivory border border-linen mx-auto flex items-center justify-center mb-4">
                <it.icon className={`h-5 w-5 ${it.color}`} strokeWidth={1.3} />
              </div>
              <div className="font-display text-lg mb-1.5">{it.title}</div>
              <p className="text-sm text-ink/60 leading-relaxed">{it.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
