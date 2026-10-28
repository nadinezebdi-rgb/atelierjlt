'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search, Heart, User, ShoppingBag, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
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
    items: (cfg.items || []).filter((i) => i.show !== false).map((i) => ({
      name: i.label, href: i.href,
      children: (i.children || []).filter((c) => c.show !== false).map((c) => ({ name: c.label, href: c.href })),
    })),
    options: cfg.options || mergeNavbar(null).options,
  }
}

export default function Header({ transparent = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobile, setMobile] = useState(false)
  const { count, setOpen, salesOpen } = useCart()
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
              className={cn('relative items-center gap-2 hover:opacity-60 transition', navOpt.showCart && salesOpen === true ? 'flex' : 'hidden')}
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
              <DesktopNavItem key={n.name + n.href} item={n} isActive={isActive} />
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
                  <div key={n.name + n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setMobile(false)}
                      aria-current={isActive(n.href) ? 'page' : undefined}
                      className={cn('block font-display text-2xl py-2 hover:text-terracotta transition', isActive(n.href) && 'text-emerald')}
                    >
                      {n.name}
                    </Link>
                    {n.children?.length > 0 && (
                      <div className="pl-4 pb-2 border-l border-linen ml-1 space-y-1">
                        {n.children.map((c) => (
                          <Link
                            key={c.name + c.href}
                            href={c.href}
                            onClick={() => setMobile(false)}
                            className={cn('block text-[13px] uppercase tracking-[0.2em] py-1.5 text-ink/70 hover:text-terracotta', isActive(c.href) && 'text-emerald')}
                          >
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
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

/** Lien du menu (ordinateur / iPad) — avec sous-menu déroulant s'il a des sous-liens. */
function DesktopNavItem({ item, isActive }) {
  const [open, setOpen] = useState(false)
  const hasChildren = item.children?.length > 0
  const active = isActive(item.href) || (hasChildren && item.children.some((c) => isActive(c.href)))
  const linkCls = cn(
    'text-[11px] uppercase tracking-[0.22em] transition-colors py-1 border-b inline-flex items-center gap-1',
    active ? 'text-emerald border-emerald' : 'text-ink/75 hover:text-emerald border-transparent'
  )
  if (!hasChildren) {
    return (
      <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkCls}>
        {item.name}
      </Link>
    )
  }
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
      data-testid={`nav-dropdown-${item.name}`}
    >
      <div className="flex items-center">
        <Link href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={linkCls}>
          {item.name}
        </Link>
        <button
          type="button"
          aria-label={`Ouvrir le sous-menu ${item.name}`}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="h-8 w-6 flex items-center justify-center text-ink/60 hover:text-emerald"
        >
          <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} strokeWidth={1.8} />
        </button>
      </div>
      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
          <div className="min-w-[220px] bg-ivory border border-linen shadow-xl py-2" role="menu">
            {item.children.map((c) => (
              <Link
                key={c.name + c.href}
                href={c.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  'block px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] whitespace-nowrap transition-colors',
                  isActive(c.href) ? 'text-emerald bg-emerald/5' : 'text-ink/75 hover:text-emerald hover:bg-cream/60'
                )}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
