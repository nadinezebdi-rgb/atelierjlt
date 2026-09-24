'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

/**
 * Bannière éditoriale plein-écran style Ferm Living
 * — image + petit label + gros titre + CTA (lien).
 *
 * Props :
 *  - image (url)
 *  - eyebrow (petit texte au-dessus)
 *  - title  (grand titre)
 *  - cta    { label, href }
 *  - align  'left' | 'right' | 'center'  (position du bloc texte)
 *  - overlay 'dark' | 'light'  (couleur de fond & tinte)
 *  - height 'lg' (h-[70vh]) | 'md' (h-[54vh])
 */
export default function EditorialBanner({
  image, eyebrow, title, cta, align = 'left', overlay = 'dark', height = 'lg',
}) {
  const heights = { lg: 'h-[70vh] min-h-[540px]', md: 'h-[54vh] min-h-[420px]' }
  const isDark = overlay === 'dark'
  const textColor = isDark ? 'text-ivory' : 'text-ink'
  const btnBg = isDark ? 'bg-ivory text-ink hover:bg-emerald hover:text-ivory' : 'bg-ink text-ivory hover:bg-emerald'
  const alignCls = {
    left: 'items-center justify-start text-left',
    right: 'items-center justify-end text-right',
    center: 'items-center justify-center text-center',
  }[align]

  return (
    <section className={`relative w-full overflow-hidden ${heights[height]}`}>
      <motion.div
        initial={{ scale: 1.05 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="w-full h-full object-cover" />
        {isDark && <div className="absolute inset-0 bg-ink/35" />}
      </motion.div>

      <div className={`relative h-full container flex ${alignCls} py-14 md:py-24`}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          className={`max-w-xl ${textColor}`}
        >
          {eyebrow && (
            <span className={`block text-[10px] md:text-[11px] uppercase tracking-[0.42em] mb-4 opacity-85`}>
              {eyebrow}
            </span>
          )}
          <h2
            className="font-display text-4xl md:text-6xl leading-[1.02] text-balance"
            style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
          >
            {title}
          </h2>
          {cta && (
            <div className={align === 'center' ? 'mt-9 flex justify-center' : 'mt-9'}>
              <Link
                href={cta.href}
                className={`inline-flex items-center gap-3 px-8 py-4 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500 ${btnBg}`}
              >
                {cta.label}
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
