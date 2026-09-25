'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ZoomIn } from 'lucide-react'

/**
 * Image galerie avec :
 *  - fondu-croisé quand la clé change (variante ou index)
 *  - zoom lisse au survol (mouse-tracked origin) sur desktop
 *  - clic → zoom fullscreen (via prop onClickZoom)
 *  - Sur mobile / touch, désactive le hover zoom
 */
export default function ZoomableImage({ src, alt, keyId, onClickZoom, badge, scale = 2.2 }) {
  const containerRef = useRef(null)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const [hover, setHover] = useState(false)

  const onMouseMove = (e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setOrigin({ x, y })
  }

  return (
    <motion.div
      ref={containerRef}
      key={keyId}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      onClick={onClickZoom}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setOrigin({ x: 50, y: 50 }) }}
      onMouseMove={onMouseMove}
      className="relative aspect-[4/5] bg-cream overflow-hidden cursor-zoom-in group select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out will-change-transform"
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transform: hover ? `scale(${scale})` : 'scale(1)',
        }}
      />
      {/* Indicateur discret en coin */}
      <div className="absolute bottom-4 right-4 hidden md:flex items-center gap-1.5 bg-ivory/90 backdrop-blur-sm px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] text-ink/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <ZoomIn className="h-3 w-3" strokeWidth={1.5} />
        Survoler pour zoomer
      </div>
      {badge && (
        <span className="absolute top-6 left-6 bg-brique text-ivory text-[10px] uppercase tracking-[0.22em] px-3 py-1.5 z-10">
          {badge}
        </span>
      )}
    </motion.div>
  )
}
