import { cleanBrandText } from '@/lib/brand-text'
// Menu de navigation (navbar) — modifiable dans /admin → Menu, footer & pages.

export const NAV_PAGE_OPTIONS = [
  { href: '/', label: 'Accueil' },
  { href: '/produits', label: 'Produits (tous)' },
  { href: '/produits?cat=nouveautes', label: 'Produits — Nouveautés' },
  { href: '/produits?cat=editions-limitees', label: 'Produits — Éditions limitées' },
  { href: '/produits?cat=intemporels', label: 'Collection — Les Intemporels' },
  { href: '/collection/printemps-ete-2027', label: 'Collection — Printemps / Été 2027' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/journal', label: 'Journal' },
  { href: '/contact', label: 'Contact' },
  { href: '/suivi', label: 'Suivi de commande' },
  { href: '/livraison', label: 'Livraison & retours' },
]

export const NAVBAR_DEFAULTS = {
  items: [
    { label: 'Accueil', href: '/', show: true },
    {
      label: 'Produits', href: '/produits', show: true,
      children: [
        { label: 'Tous les produits', href: '/produits', show: true },
        { label: 'Nouveautés', href: '/produits?cat=nouveautes', show: true },
        { label: 'Les Intemporels', href: '/produits?cat=intemporels', show: true },
        { label: 'Éditions limitées', href: '/produits?cat=editions-limitees', show: true },
        { label: 'Printemps / Été 2027', href: '/collection/printemps-ete-2027', show: true },
      ],
    },
    { label: 'Printemps/Été 2027', href: '/collection/printemps-ete-2027', show: true },
    { label: 'Nouveautés', href: '/produits?cat=nouveautes', show: true },
    { label: 'Éditions limitées', href: '/produits?cat=editions-limitees', show: true },
    { label: 'À propos', href: '/a-propos', show: true },
    { label: 'Journal', href: '/journal', show: true },
    { label: 'Contact', href: '/contact', show: true },
  ],
}

// Anciennes adresses → nouvelles (les liens /collections restent fonctionnels)
export const PE_HREF = '/collection/printemps-ete-2027'

export function normalizeHref(href) {
  let h = String(href || '').trim()
  if (h === '/collections') h = '/produits'
  else if (h.startsWith('/collections?')) h = '/produits' + h.slice('/collections'.length)
  // Ancienne adresse / filtre de la collection printemps-été → sa page dédiée
  if (h.startsWith('/collection/printemps-ete') || /[?&](cat|collection)=pe-2026-2027\b/.test(h)) return PE_HREF
  return h
}

// Liens vers des collections qui n'existent plus (Terre, ou une page /collection/… inconnue)
export function isRemovedCollectionHref(href) {
  const h = normalizeHref(href)
  if (h.startsWith('/collection/') && h !== PE_HREF) return true
  const p = new URLSearchParams(h.split('?')[1] || '')
  return [p.get('cat'), p.get('collection')].some((v) => v === 'terre')
}

const hasHref = (list, href) => list.some((i) => normalizeHref(i.href) === href || (i.children || []).some((c) => normalizeHref(c.href) === href))

export function mergeNavbar(saved) {
  let raw = Array.isArray(saved?.items) && saved.items.length ? saved.items : NAVBAR_DEFAULTS.items
  // Menu enregistré avant le retour des collections : on ajoute une fois
  // « Printemps/Été 2027 » (lien principal) et « Les Intemporels » (sous Produits).
  // Ensuite le choix fait dans l'admin est respecté (collectionsV2).
  if (saved?.items?.length && saved.collectionsV2 !== true) {
    raw = raw.map((i) => ({ ...i, children: Array.isArray(i.children) ? [...i.children] : [] }))
    const prodIdx = raw.findIndex((i) => normalizeHref(i.href) === '/produits')
    if (!hasHref(raw, '/produits?cat=intemporels') && prodIdx >= 0) {
      raw[prodIdx].children.push({ label: 'Les Intemporels', href: '/produits?cat=intemporels', show: true })
    }
    const peIdx = raw.findIndex((i) => normalizeHref(i.href) === PE_HREF)
    if (peIdx >= 0) {
      raw[peIdx] = { ...raw[peIdx], label: 'Printemps/Été 2027', show: true }
    } else {
      raw.splice(prodIdx >= 0 ? prodIdx + 1 : raw.length, 0, { label: 'Printemps/Été 2027', href: PE_HREF, show: true })
    }
  }
  const items = raw
    .filter((i) => !isRemovedCollectionHref(i.href))
    .map((i) => ({ ...i, children: (Array.isArray(i.children) ? i.children : []).filter((c) => !isRemovedCollectionHref(c.href)) }))
  return {
    items: items.map((i) => ({
      label: cleanBrandText(i.label || ''), href: normalizeHref(i.href) || '/', show: i.show !== false,
      children: (Array.isArray(i.children) ? i.children : []).map((c) => ({ label: cleanBrandText(c.label || ''), href: normalizeHref(c.href) || '/', show: c.show !== false })),
    })),
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
