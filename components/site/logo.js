'use client'

import { cn } from '@/lib/utils'

/**
 * Logo Atelier JLT — police Instrument Serif (Google Fonts).
 * Serif éditorial moderne, à haut contraste, très utilisé par les marques
 * boutique / maisons de décoration premium (Sézane, Toast, Ferm Living-like).
 *
 * « Atelier » (taille moyenne) au-dessus de « JLT » (grand format),
 * même vert émeraude profond (#0F5C3F), même poids, aucune décoration.
 *
 * Variantes :
 *  - variant="dark"   → émeraude sur fonds clairs
 *  - variant="light"  → ivoire au-dessus d'images sombres
 *  - size="sm" | "md" | "lg" | "xl"
 */
export default function Logo({ variant = 'dark', size = 'lg', className }) {
  const isLight = variant === 'light'
  const color = isLight ? '#F7F4EF' : '#0F5C3F'

  const wrapClasses = {
    sm: 'gap-0',
    md: 'gap-0',
    lg: 'gap-0',
    xl: 'gap-0.5',
  }
  // "Atelier"
  const atelierClasses = {
    sm: 'text-[16px] leading-[0.95]',
    md: 'text-[22px] leading-[0.95]',
    lg: 'text-[30px] md:text-[36px] leading-[0.95]',
    xl: 'text-[38px] md:text-[48px] leading-[0.95]',
  }
  // "JLT" — 2x plus grand environ
  const jltClasses = {
    sm: 'text-[30px] leading-[1]',
    md: 'text-[42px] leading-[1]',
    lg: 'text-[60px] md:text-[74px] leading-[1]',
    xl: 'text-[78px] md:text-[100px] leading-[1]',
  }

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center leading-none select-none',
        wrapClasses[size],
        className
      )}
      style={{
        color,
        fontFamily: 'var(--font-logo), "Instrument Serif", Georgia, serif',
        fontWeight: 400,
      }}
    >
      <span className={atelierClasses[size]} style={{ letterSpacing: '-0.01em' }}>
        Atelier
      </span>
      <span
        className={jltClasses[size]}
        style={{ letterSpacing: '0.02em' }}
      >
        JLT
      </span>
    </div>
  )
}
