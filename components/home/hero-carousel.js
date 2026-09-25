'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import HeroFerm from './hero-ferm'

/**
 * Enveloppe optionnelle autour de <HeroFerm/>.
 * - Si `slides` est vide ou < 2 → rend un seul HeroFerm (compat 100%)
 * - Sinon → fait tourner les compositions avec un fondu croisé
 *
 * Chaque slide est un objet ayant la même forme que `content.hero`.
 */
export default function HeroCarousel({ slides = [], intervalMs = 5000, fallback = null }) {
  const list = Array.isArray(slides) ? slides.filter(Boolean) : []
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (list.length < 2) return
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % list.length)
    }, Math.max(2000, Number(intervalMs) || 5000))
    return () => clearInterval(t)
  }, [list.length, intervalMs])

  // Aucune slide → composition par défaut (fallback)
  if (list.length === 0) {
    return fallback ? <HeroFerm {...fallback} /> : <HeroFerm />
  }

  // Une seule slide → rendu direct (pas d'AnimatePresence)
  if (list.length === 1) {
    return <HeroFerm {...list[0]} />
  }

  const current = list[index] || list[0]

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <HeroFerm {...current} />
        </motion.div>
      </AnimatePresence>

      {/* Indicateurs (bullets) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-auto">
        {list.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Composition ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-8 bg-ivory' : 'w-1.5 bg-ivory/60 hover:bg-ivory/90'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
