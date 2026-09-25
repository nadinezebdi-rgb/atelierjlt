'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { IMAGES } from '@/lib/data/products'

/**
 * Hero polyvalent avec 2 mises en page :
 *   - 'full-image'  → image (ou vidéo) horizontale plein cadre, texte superposé
 *   - 'split'       → 2 colonnes (texte à gauche, image à droite)
 *
 * Options V2 :
 *   - useCustomPosition + textCoords → drag & drop du bloc texte au pixel près
 *   - textColorMode 'auto' | 'white' | 'black' + heroTextColor (pré-calculé)
 *   - parallaxEnabled + parallaxIntensity → effet de parallaxe au scroll
 *
 * Chaque élément (surtitre, titre, sous-titre, boutons, signature) peut être
 * masqué individuellement depuis l'admin.
 */
export default function HeroFerm({
  media,
  eyebrow,
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  signature,
  layout,
  textPosition,     // pour 'full-image' : center | bottom-left | bottom-right | top-left | top-right
  overlayIntensity, // 0 (sans voile) → 100 (voile noir opaque)
  showEyebrow = true,
  showTitle = true,
  showSubtitle = true,
  showPrimary = true,
  showSecondary = true,
  showSignature = true,
  // V2 — WYSIWYG + contraste + parallaxe
  useCustomPosition = false,
  textCoords = { x: 8, y: 65 },
  textAlign = 'left',        // 'left' | 'center' | 'right'
  textColorMode = 'auto',    // 'auto' | 'white' | 'black'
  heroTextColor = 'white',   // valeur pré-calculée si mode 'auto'
  parallaxEnabled = false,
  parallaxIntensity = 25,    // 0-100
  animateIn = true,          // permet de désactiver les anims dans l'aperçu admin
}) {
  const mediaUrl = media || IMAGES.heroBeige
  const isVideo = /\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl) || (mediaUrl.includes('/api/file/') && /\.(mp4|webm|mov)/i.test(mediaUrl))
  const heroLayout = layout || 'full-image'
  const heroEyebrow = eyebrow || 'Nouvelle Collection · Automne-Hiver 2025'
  const heroTitle = title || 'L’art discret\nde la maison.'
  const heroSubtitle = subtitle || 'Plaids crochet, macramé mural, poterie tournée main — chaque pièce imaginée, fabriquée et assemblée à la main dans notre atelier français.'
  const cta1 = ctaPrimary || { label: 'Découvrir la collection', href: '/collections?cat=nouveautes' }
  const cta2 = ctaSecondary || { label: 'Notre atelier', href: '/atelier' }
  const sig = signature || 'Plaid Sylvestre · Crochet main'
  const overlayA = Math.min(100, Math.max(0, overlayIntensity ?? 30)) / 100
  const pos = textPosition || 'bottom-left'

  // Couleur du texte finale
  const resolvedColor = textColorMode === 'auto' ? (heroTextColor || 'white') : textColorMode
  const isDarkText = resolvedColor === 'black'
  const textColorClass = isDarkText ? 'text-ink' : 'text-ivory'
  const textColorSoft  = isDarkText ? 'text-ink/70' : 'text-ivory/85'
  const textColorSofter= isDarkText ? 'text-ink/60' : 'text-ivory/90'
  const btnPrimaryClass = 'bg-emerald text-ivory hover:bg-emeraldDark'
  const btnSecondaryClass = isDarkText
    ? 'border border-ink text-ink hover:bg-ink hover:text-ivory'
    : 'border border-ivory text-ivory hover:bg-ivory hover:text-emerald'

  // Parallaxe : useScroll + useTransform (uniquement pour full-image)
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const parallaxRange = Math.max(0, Math.min(100, parallaxIntensity)) // %
  const yShift = useTransform(scrollYProgress, [0, 1], ['0%', `${parallaxRange}%`])

  const media_ = isVideo ? (
    <video
      src={mediaUrl}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      className="absolute inset-0 w-full h-full object-cover"
      aria-label="Vidéo d'ambiance Atelier JLT"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl}
      alt="Atelier JLT — Salon crème avec plaid beige"
      className="absolute inset-0 w-full h-full object-cover"
      draggable={false}
    />
  )

  if (heroLayout === 'full-image') {
    // Positions du bloc texte (mode preset)
    const posClasses = {
      'center':       'items-center justify-center text-center',
      'bottom-left':  'items-start justify-end text-left',
      'bottom-right': 'items-end justify-end text-right',
      'top-left':     'items-start justify-start text-left',
      'top-right':    'items-end justify-start text-right',
    }[pos] || 'items-start justify-end text-left'

    const hasAnyText = showEyebrow || showTitle || showSubtitle || showPrimary || showSecondary || showSignature

    // Style bloc en mode WYSIWYG (position exacte)
    const customBlockStyle = useCustomPosition ? {
      position: 'absolute',
      left: `${textCoords?.x ?? 8}%`,
      top:  `${textCoords?.y ?? 65}%`,
      transform: `translate(${textAlign === 'right' ? '-100%' : textAlign === 'center' ? '-50%' : '0'}, -50%)`,
      textAlign,
      maxWidth: '640px',
      width: 'min(90%, 640px)',
    } : null

    const customAlignClass = {
      left:   'text-left',
      center: 'text-center',
      right:  'text-right',
    }[textAlign] || 'text-left'

    const anim = (delay = 0) => animateIn ? {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.8, delay },
    } : {}

    return (
      <section ref={sectionRef} className="relative bg-cream overflow-hidden">
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] lg:aspect-[5/2] overflow-hidden">
          {/* Média (avec ou sans parallaxe) */}
          {parallaxEnabled ? (
            <motion.div
              style={{ y: yShift }}
              className="absolute -top-[10%] left-0 right-0 -bottom-[10%] w-full will-change-transform"
            >
              {media_}
            </motion.div>
          ) : media_}
          {/* Voile assombri pour la lisibilité du texte */}
          {overlayA > 0 && hasAnyText && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(180deg, rgba(0,0,0,${overlayA * 0.3}) 0%, rgba(0,0,0,${overlayA}) 100%)` }}
            />
          )}
          {/* Bloc texte overlay — WYSIWYG ou preset */}
          {hasAnyText && (
            useCustomPosition ? (
              <div style={customBlockStyle} className={customAlignClass}>
                {showEyebrow && heroEyebrow && (
                  <motion.span {...anim(0)} className={`block text-[10px] md:text-[11px] uppercase tracking-[0.42em] ${textColorSofter} mb-4`}>
                    {heroEyebrow}
                  </motion.span>
                )}
                {showTitle && heroTitle && (
                  <motion.h1 {...anim(0.1)}
                    className={`text-[42px] leading-[1] md:text-[68px] lg:text-[84px] md:leading-[0.95] ${textColorClass} text-balance whitespace-pre-line`}
                    style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
                  >
                    {heroTitle}
                  </motion.h1>
                )}
                {showSubtitle && heroSubtitle && (
                  <motion.p {...anim(0.2)} className={`mt-4 md:mt-6 text-sm md:text-base ${textColorSoft} leading-relaxed max-w-xl`}>
                    {heroSubtitle}
                  </motion.p>
                )}
                {((showPrimary && cta1?.href && cta1?.label) || (showSecondary && cta2?.href && cta2?.label)) && (
                  <motion.div {...anim(0.3)} className={`mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 ${textAlign === 'center' ? 'sm:justify-center' : textAlign === 'right' ? 'sm:justify-end' : ''}`}>
                    {showPrimary && cta1?.href && cta1?.label && (
                      <Link href={cta1.href} className={`group inline-flex items-center justify-center gap-3 ${btnPrimaryClass} px-7 py-3.5 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500`}>
                        {cta1.label}
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                      </Link>
                    )}
                    {showSecondary && cta2?.href && cta2?.label && (
                      <Link href={cta2.href} className={`inline-flex items-center justify-center gap-3 ${btnSecondaryClass} px-7 py-3.5 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500`}>
                        {cta2.label}
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
            ) : (
              <div className={`absolute inset-0 flex flex-col ${posClasses} p-6 md:p-12 lg:p-20`}>
                <div className="max-w-2xl">
                  {showEyebrow && heroEyebrow && (
                    <motion.span {...anim(0)} className={`block text-[10px] md:text-[11px] uppercase tracking-[0.42em] ${textColorSofter} mb-4`}>
                      {heroEyebrow}
                    </motion.span>
                  )}
                  {showTitle && heroTitle && (
                    <motion.h1 {...anim(0.1)}
                      className={`text-[42px] leading-[1] md:text-[68px] lg:text-[84px] md:leading-[0.95] ${textColorClass} text-balance whitespace-pre-line`}
                      style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
                    >
                      {heroTitle}
                    </motion.h1>
                  )}
                  {showSubtitle && heroSubtitle && (
                    <motion.p {...anim(0.2)} className={`mt-4 md:mt-6 text-sm md:text-base ${textColorSoft} leading-relaxed max-w-xl`}>
                      {heroSubtitle}
                    </motion.p>
                  )}
                  {((showPrimary && cta1?.href && cta1?.label) || (showSecondary && cta2?.href && cta2?.label)) && (
                    <motion.div {...anim(0.3)} className={`mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 ${pos === 'center' ? 'sm:justify-center' : pos.includes('right') ? 'sm:justify-end' : ''}`}>
                      {showPrimary && cta1?.href && cta1?.label && (
                        <Link href={cta1.href} className={`group inline-flex items-center justify-center gap-3 ${btnPrimaryClass} px-7 py-3.5 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500`}>
                          {cta1.label}
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                        </Link>
                      )}
                      {showSecondary && cta2?.href && cta2?.label && (
                        <Link href={cta2.href} className={`inline-flex items-center justify-center gap-3 ${btnSecondaryClass} px-7 py-3.5 text-[11px] uppercase tracking-[0.32em] transition-colors duration-500`}>
                          {cta2.label}
                        </Link>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )
          )}
          {/* Étiquette signature */}
          {showSignature && sig && (
            <div className={`absolute ${pos.includes('left') && !useCustomPosition ? 'right-4 md:right-6' : 'left-4 md:left-6'} bottom-4 md:bottom-6 bg-ivory/90 backdrop-blur px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-emerald`}>
              {sig}
            </div>
          )}
        </div>
      </section>
    )
  }

  // Layout 'split' — 2 colonnes (ancienne mise en page conservée en option)
  return (
    <section className="relative bg-ivory">
      <div className="container grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 lg:gap-16 py-10 md:py-16 lg:py-20 items-center">
        <div className="max-w-xl">
          {showEyebrow && heroEyebrow && (
            <motion.span initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="block text-[10px] md:text-[11px] uppercase tracking-[0.42em] text-emerald mb-5">
              {heroEyebrow}
            </motion.span>
          )}
          {showTitle && heroTitle && (
            <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
              className="text-[46px] leading-[1] md:text-[80px] lg:text-[92px] md:leading-[0.95] text-balance whitespace-pre-line"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400, color: '#0F5C3F' }}
            >
              {heroTitle}
            </motion.h1>
          )}
          {showSubtitle && heroSubtitle && (
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-6 md:mt-8 text-base md:text-lg text-ink/70 leading-relaxed">
              {heroSubtitle}
            </motion.p>
          )}
          {((showPrimary && cta1?.href && cta1?.label) || (showSecondary && cta2?.href && cta2?.label)) && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }} className="mt-9 md:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
              {showPrimary && cta1?.href && cta1?.label && (
                <Link href={cta1.href} className="group inline-flex items-center justify-center gap-3 bg-emerald text-ivory px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emeraldDark transition-colors duration-500">
                  {cta1.label}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" strokeWidth={1.5} />
                </Link>
              )}
              {showSecondary && cta2?.href && cta2?.label && (
                <Link href={cta2.href} className="inline-flex items-center justify-center gap-3 border border-emerald text-emerald px-8 py-4 text-[11px] uppercase tracking-[0.32em] hover:bg-emerald hover:text-ivory transition-colors duration-500">
                  {cta2.label}
                </Link>
              )}
            </motion.div>
          )}
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[11px] uppercase tracking-[0.24em] text-ink/50">
            <span>Fabrication française</span><span>·</span>
            <span>Livraison offerte dès 150 €</span><span>·</span>
            <span>Emballage soigné</span>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] md:aspect-[5/6] lg:aspect-[4/5] w-full overflow-hidden bg-cream"
        >
          {media_}
          {showSignature && sig && (
            <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 bg-ivory/90 backdrop-blur px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-emerald">
              {sig}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
