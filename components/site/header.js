'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Heart, User, ShoppingBag, X } from 'lucide-react'
import { useCart } from './cart-provider'
import { useAuth } from './auth-provider'
import Logo from './logo'
import { cn } from '@/lib/utils'

const nav = [
  { name: 'Collections',        href: '/collections' },
  { name: 'Nouveautés',         href: '/collections?cat=nouveautes' },
  { name: 'Éditions limitées',  href: '/collections?cat=editions-limitees' },
  { name: 'Notre Atelier',      href: '/atelier' },
  { name: 'Journal',            href: '/journal' },
  { name: 'Contact',            href: '/contact' },
]

export default function Header({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile] = useState(false)
  const { count, setOpen } = useCart()
  const { user } = useAuth()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Sur les pages transparentes (accueil), la barre flotte au-dessus du hero
  // sans laisser de bande blanche. Le hero étant maintenant crème (clair),
  // le logo et les icônes restent en teinte foncée pour la lisibilité.
  const overlayHero = transparent && !scrolled
  const solid = scrolled || !transparent

  return (
    <>
      <header
        className={cn(
          'left-0 right-0 z-40 transition-colors duration-500',
          'sticky top-0 bg-ivory/95 backdrop-blur-md border-b border-linen/60',
          scrolled ? 'shadow-[0_1px_0_rgba(0,0,0,0.02)]' : ''
        )}
      >
        <div className="container flex items-center justify-between h-28 md:h-36 pt-3 md:pt-4">
          {/* Left: menu + search */}
          <div className={cn('flex items-center gap-5', 'text-ink')}>
            <button
              aria-label="Menu"
              onClick={() => setMobile(true)}
              className="lg:hidden -ml-1 p-1 hover:opacity-70 transition"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <button className="hidden lg:flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] hover:opacity-60 transition">
              <Search className="h-4 w-4" strokeWidth={1.5} /> Rechercher
            </button>
          </div>

          {/* Center: logo Atelier JLT */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
            aria-label="Atelier JLT — accueil"
          >
            <Logo variant="dark" size="lg" />
          </Link>

          {/* Right: icons */}
          <div className={cn('flex items-center gap-4 md:gap-5', 'text-ink')}>
            <Link href="/wishlist" className="hidden md:block hover:opacity-60 transition" aria-label="Favoris">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <Link href="/compte" className="hidden md:flex items-center gap-1.5 hover:opacity-60 transition" aria-label="Mon compte">
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {user && <span className="text-[11px] uppercase tracking-[0.22em] max-w-[100px] truncate">{(user.name || user.email.split('@')[0])}</span>}
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Panier"
              className="relative flex items-center gap-2 hover:opacity-60 transition"
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
              <span className="hidden md:inline text-[11px] uppercase tracking-[0.22em] tabular-nums">
                Panier ({count})
              </span>
              {count > 0 && (
                <span className="md:hidden absolute -top-2 -right-2 bg-terracotta text-ivory rounded-full h-4 w-4 flex items-center justify-center text-[10px] tabular-nums">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav
          className={cn(
            'hidden lg:block border-t border-linen/60'
          )}
        >
          <div className="container flex items-center justify-center gap-8 xl:gap-12 h-12">
            {nav.map((n) => (
              <Link
                key={n.name}
                href={n.href}
                className={cn(
                  'text-[11px] uppercase tracking-[0.22em] transition-colors',
                  'text-ink/75 hover:text-emerald'
                )}
              >
                {n.name}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/40 z-50 lg:hidden"
              onClick={() => setMobile(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-ivory z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-linen/60">
                <Logo variant="dark" size="sm" />
                <button onClick={() => setMobile(false)} aria-label="Fermer">
                  <X className="h-5 w-5" strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-6 space-y-2">
                {nav.map((n) => (
                  <Link
                    key={n.name}
                    href={n.href}
                    onClick={() => setMobile(false)}
                    className="block font-display text-2xl py-2 hover:text-terracotta transition"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
              <div className="p-6 border-t border-linen/60 space-y-3 text-[11px] uppercase tracking-[0.24em]">
                <Link href="/compte" onClick={() => setMobile(false)} className="block">Mon compte</Link>
                <Link href="/wishlist" onClick={() => setMobile(false)} className="block">Favoris</Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
