'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Heart, User, ShoppingBag, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { mergeNavbar, isActiveHref } from '@/lib/navbar'
import { useCart } from './cart-provider'
import { useAuth } from './auth-provider'
import Logo from './logo'
import { cn } from '@/lib/utils'

// Menu modifiable dans /admin → Menu, footer & pages (valeurs par défaut ci-dessous)
let navCache = null
function useNavConfig() {
  const [cfg, setCfg] = useState(() => navCache || mergeNavbar(null))
  useEffect(() => {
    if (navCache) return
    fetch('/api/site-pages/navbar')
      .then((r) => r.json())
      .then((d) => {
        if (d?.navbar?.items) {
          navCache = d.navbar
          setCfg(d.navbar)
        }
      })
      .catch(() => {})
  }, [])
  return {
    items: (cfg.items || []).filter((i) => i.show !== false).map((i) => ({ name: i.label, href: i.href })),
    options: cfg.options || mergeNavbar(null).options,
  }
}

export default function Header({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile] = useState(false)
  const { count, setOpen } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { items: nav, options: navOpt } = useNavConfig()
  const pathname = usePathname() || '/'
  const [search, setSearch] = useState('')
  useEffect(() => {
    const s = window.location.search
    if (s !== search) setSearch(s)
  })
  const isActive = (href) => isActiveHref(href, pathname, search)
  // Retour : page précédente si elle existe, sinon l'accueil
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }

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
          navOpt.sticky ? 'sticky top-0' : 'relative',
          'bg-ivory/95 backdrop-blur-md border-b border-linen/60',
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
            <div className="flex items-center">
              {/* Navigation précédente / suivante */}
              <div className={cn('flex items-center gap-1.5', !navOpt.showArrows && 'hidden')} data-testid="header-history-nav">
                <button
                  type="button"
                  onClick={goBack}
                  aria-label="Page précédente"
                  title="Page précédente"
                  data-testid="nav-back"
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-ink/15 hover:border-emerald hover:text-emerald transition"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => router.forward()}
                  aria-label="Page suivante"
                  title="Page suivante"
                  data-testid="nav-forward"
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-ink/15 hover:border-emerald hover:text-emerald transition"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>

          {/* Center: logo Atelier JLT */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center"
            aria-label="Atelier JLT — accueil"
          >
            {navOpt.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={navOpt.logoImage} alt="Atelier JLT" className={navOpt.logoSize === 'md' ? 'h-12 md:h-16 w-auto object-contain' : 'h-16 md:h-24 w-auto object-contain'} />
            ) : (
              <Logo variant="dark" size={navOpt.logoSize === 'md' ? 'md' : 'lg'} />
            )}
          </Link>

          {/* Right: icons */}
          <div className={cn('flex items-center gap-4 md:gap-5', 'text-ink')}>
            <Link href="/wishlist" className={cn('hidden hover:opacity-60 transition', navOpt.showWishlist && 'md:block')} aria-label="Favoris">
              <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            </Link>
            <Link href="/compte" className={cn('hidden items-center gap-1.5 hover:opacity-60 transition', navOpt.showAccount && 'md:flex')} aria-label="Mon compte">
              <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
              {user && <span className="text-[11px] uppercase tracking-[0.22em] max-w-[100px] truncate">{(user.name || user.email.split('@')[0])}</span>}
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label="Panier"
              className={cn('relative items-center gap-2 hover:opacity-60 transition', navOpt.showCart ? 'flex' : 'hidden')}
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
            'hidden border-t border-linen/60', navOpt.visible && 'lg:block'
          )}
        >
          <div className={cn('container flex items-center gap-8 xl:gap-12 h-12', navOpt.linksAlign === 'left' ? 'justify-start' : navOpt.linksAlign === 'right' ? 'justify-end' : 'justify-center')}>
            {nav.map((n) => (
              <Link
                key={n.name + n.href}
                href={n.href}
                aria-current={isActive(n.href) ? 'page' : undefined}
                className={cn(
                  'text-[11px] uppercase tracking-[0.22em] transition-colors py-1 border-b',
                  isActive(n.href) ? 'text-emerald border-emerald' : 'text-ink/75 hover:text-emerald border-transparent'
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
                    key={n.name + n.href}
                    href={n.href}
                    onClick={() => setMobile(false)}
                    aria-current={isActive(n.href) ? 'page' : undefined}
                    className={cn('block font-display text-2xl py-2 hover:text-terracotta transition', isActive(n.href) && 'text-emerald')}
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
