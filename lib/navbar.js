// Menu de navigation (navbar) — modifiable dans /admin → Menu, footer & pages.

export const NAV_PAGE_OPTIONS = [
  { href: '/', label: 'Accueil' },
  { href: '/produits', label: 'Produits (tous)' },
  { href: '/produits?cat=nouveautes', label: 'Produits — Nouveautés' },
  { href: '/produits?cat=editions-limitees', label: 'Produits — Éditions limitées' },
  { href: '/produits?cat=intemporels', label: 'Produits — Les Intemporels' },
  { href: '/collection/printemps-ete-2026-2027', label: 'Collection Printemps / Été 2026-2027' },
  { href: '/a-propos', label: 'À propos de nous' },
  { href: '/journal', label: 'Journal' },
  { href: '/contact', label: 'Contact' },
  { href: '/suivi', label: 'Suivi de commande' },
  { href: '/livraison', label: 'Livraison & retours' },
]

export const NAVBAR_DEFAULTS = {
  items: [
    { label: 'Accueil', href: '/', show: true },
    { label: 'Produits', href: '/produits', show: true },
    { label: 'Nouveautés', href: '/produits?cat=nouveautes', show: true },
    { label: 'Éditions limitées', href: '/produits?cat=editions-limitees', show: true },
    { label: 'À propos de nous', href: '/a-propos', show: true },
    { label: 'Journal', href: '/journal', show: true },
    { label: 'Contact', href: '/contact', show: true },
  ],
}

// Anciennes adresses → nouvelles (les liens /collections restent fonctionnels)
export function normalizeHref(href) {
  const h = String(href || '').trim()
  if (h === '/collections') return '/produits'
  if (h.startsWith('/collections?')) return '/produits' + h.slice('/collections'.length)
  return h
}

export function mergeNavbar(saved) {
  const items = Array.isArray(saved?.items) && saved.items.length ? saved.items : NAVBAR_DEFAULTS.items
  return {
    items: items.map((i) => ({ label: i.label || '', href: normalizeHref(i.href) || '/', show: i.show !== false })),
    options: mergeNavbarOptions(saved),
  }
}

/** Le lien correspond-il à la page affichée ? (gère ?cat=…) */
export function isActiveHref(href, pathname, search) {
  const [path, query = ''] = String(href || '').split('?')
  const current = pathname === '/collections' ? '/produits' : pathname
  if (path === '/') return current === '/'
  if (current !== path && !current.startsWith(path + '/')) return false
  const want = new URLSearchParams(query).get('cat') || ''
  const have = new URLSearchParams(search || '').get('cat') || ''
  return want === have
}

// Réglages d'affichage de la barre (tous modifiables dans l'admin)
export const NAVBAR_OPTION_DEFAULTS = {
  visible: true,        // afficher la barre de liens (ordinateur)
  sticky: true,         // la barre reste en haut en défilant
  linksAlign: 'center', // left | center | right
  logoSize: 'lg',       // md | lg
  logoImage: '',        // image de logo personnalisée (sinon logo texte Atelier JLT)
  showArrows: true,     // flèches précédent / suivant
  showWishlist: true,
  showAccount: true,
  showCart: true,
}

export function mergeNavbarOptions(saved) {
  const s = saved?.options || {}
  const o = { ...NAVBAR_OPTION_DEFAULTS }
  for (const k of Object.keys(o)) {
    if (typeof o[k] === 'boolean' && typeof s[k] === 'boolean') o[k] = s[k]
  }
  if (['left', 'center', 'right'].includes(s.linksAlign)) o.linksAlign = s.linksAlign
  if (['md', 'lg'].includes(s.logoSize)) o.logoSize = s.logoSize
  if (typeof s.logoImage === 'string' && (s.logoImage.startsWith('/') || /^https:\/\//i.test(s.logoImage))) o.logoImage = s.logoImage.slice(0, 500)
  return o
}
