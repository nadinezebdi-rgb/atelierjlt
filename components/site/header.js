'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Heart, User, ShoppingBag, X } from 'lucide-react'
import { useCart } from './cart-provider'
import { useAuth } from './auth-provider'
import { cn } from '@/lib/utils'

const nav = [
  { name: 'Collections', href: '/collections' },
  { name: 'Sacs', href: '/collections?cat=sacs' },
  { name: 'Bougies', href: '/collections?cat=bougies' },
  { name: 'Bijoux', href: '/collections?cat=bijoux' },
  { name: 'Décoration', href: '/collections?cat=decoration' },
  { name: 'Nouveautés', href: '/collections?cat=nouveautes' },
  { name: 'Notre Atelier', href: '/atelier' },
  { name: 'Journal', href: '/journal' },
  { name: 'Contact', href: '/contact' },
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

  const solid = scrolled || !transparent

  return (
    <>
      {/* Top marquee */}
      <div className="bg-ink text-ivory text-[11px] tracking-[0.28em] uppercase py-2.5 overflow-hidden">
        <div className="container flex items-center justify-center gap-6">
          <span>Livraison offerte dès 150 €</span>
          <span className="opacity-40">·</span>
          <span className="hidden md:inline">Fabrication française</span>
          <span className="opacity-40 hidden md:inline">·</span>
          <span className="hidden md:inline">Emballage soigné</span>
        </div>
      </div>

      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'sticky top-0 z-40 transition-colors duration-500',
          solid ? 'bg-ivory/95 backdrop-blur-md border-b border-linen/60' : 'bg-transparent'
        )}
      >
        <div className="container flex items-center justify-between h-28 md:h-40">          {/* Left: menu + search */}
          <div className="flex items-center gap-5">
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

          {/* Center: logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center" aria-label="Atelier Ginette — accueil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/api/img/logo-small"
              alt="Atelier Ginette"
              className="h-24 md:h-40 w-auto object-contain"
            />
          </Link>

          {/* Right: icons */}
          <div className="flex items-center gap-4 md:gap-5">
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
        <nav className="hidden lg:block border-t border-linen/60">
          <div className="container flex items-center justify-center gap-8 xl:gap-12 h-12">
            {nav.map((n) => (
              <Link
                key={n.name}
                href={n.href}
                className="text-[11px] uppercase tracking-[0.22em] text-ink/80 hover:text-terracotta transition-colors"
              >
                {n.name}
              </Link>
            ))}
          </div>
        </nav>
      </motion.header>

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
                <span className="font-display text-xl font-black">Ginette</span>
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
