'use client'

/**
 * Atelier JLT — Carrousel d'images personnalisées
 *
 * Utilisé quand une section "product-carousel" a été alimentée avec des
 * images custom depuis l'admin (customImages non vide). Reprend l'esthétique
 * éditoriale du site : fond ivoire, titre serif émeraude, flèches de
 * navigation discrètes, défilement horizontal snapping, images 3/4 portrait.
 *
 * Props :
 *   - eyebrow (petit texte supérieur)
 *   - title   (grand titre serif)
 *   - viewAllHref? (lien "Tout voir")
 *   - images  : [{ id, src, alt, href? }, ...]
 */
import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

function isSafeUrl(value) {
  if (!value || typeof value !== 'string' || value.trim() !== value) return false
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0020]/.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

export default function CarouselImageGallery({
  eyebrow,
  title,
  viewAllHref,
  images,
  label = 'Images de la collection',
}) {
  const scrollRef = useRef(null)
  const usable = (Array.isArray(images) ? images : []).filter((i) =>
    isSafeUrl(i?.src)
  )
  if (!usable.length) return null

  const scroll = (dir) => {
    if (!scrollRef.current) return
    const w = scrollRef.current.clientWidth * 0.7
    scrollRef.current.scrollBy({
      left: dir === 'next' ? w : -w,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-16 md:py-24 bg-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-10 md:mb-14 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9 }}
          >
            {eyebrow && (
              <span className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-3">
                {eyebrow}
              </span>
            )}
            {title && (
              <h2
                className="text-3xl md:text-5xl leading-[1.05] text-balance text-ink"
                style={{
                  fontFamily:
                    'var(--font-logo), var(--font-display), serif',
                  fontWeight: 400,
                }}
              >
                {title}
              </h2>
            )}
          </motion.div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Précédent"
              onClick={() => scroll('prev')}
              className="w-11 h-11 border border-ink/20 hover:border-emerald hover:text-emerald transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              aria-label="Suivant"
              onClick={() => scroll('next')}
              className="w-11 h-11 border border-ink/20 hover:border-emerald hover:text-emerald transition-colors flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          tabIndex={0}
          aria-label={label}
          className="flex overflow-x-auto gap-5 md:gap-7 pb-6 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald/60"
        >
          {usable.map((image) => {
            const Img = (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={image.src}
                alt={image.alt || ''}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            )
            return (
              <motion.div
                key={image.id || image.src}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8 }}
                className="group flex-none w-[75vw] sm:w-[46vw] md:w-[32vw] lg:w-[24vw] snap-start"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-linen">
                  {image.href && isSafeUrl(image.href) ? (
                    <Link
                      href={image.href}
                      aria-label={image.alt || 'Voir la création'}
                      className="absolute inset-0"
                    >
                      {Img}
                    </Link>
                  ) : (
                    Img
                  )}
                </div>
                {image.alt && (
                  <p className="mt-3 text-sm text-ink/70 leading-snug">
                    {image.alt}
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        {viewAllHref && (
          <div className="mt-10 md:mt-14 text-center">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-ink hover:text-emerald transition-colors"
            >
              Tout voir <ArrowRight className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
