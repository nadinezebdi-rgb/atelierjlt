'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, Mail, LogOut, Plus, Trash2, Save, Ticket, FileText, Settings as SettingsIcon, Upload, BookOpen, Eye, EyeOff, Edit3, ArrowUp, ArrowDown, Layers, GripVertical, X, FolderOpen, Copy, Check, Film, Image as ImageIcon, Search, ArrowUpDown, Sparkles } from 'lucide-react'
import { HOMEPAGE_SECTION_DEFAULTS, mergeHomepageSections, BANNER_TEMPLATES } from '@/lib/homepage-sections'
import HeroComposer from '@/components/admin/hero-composer'
import CarouselImageEditor from '@/components/admin/carousel-image-editor'
import MissingMediaRecovery from '@/components/admin/missing-media-recovery'
import VariantsEditor from '@/components/admin/variants-editor'
import ImageUploader from '@/components/admin/image-uploader'
import MediaPickerModal from '@/components/admin/media-picker-modal'
import MediaLibrary from '@/components/admin/media-library'
import HomeSectionsEditor from '@/components/admin/home-sections-editor'
import TabOrders from '@/components/admin/orders-tab'
import LegalPagesTab from '@/components/admin/legal-pages-tab'
import StockAlertsPanel from '@/components/admin/stock-alerts-panel'
import { availableUnits, lowStockItems, stockMismatch } from '@/lib/stock'
import PageContentEditor from '@/components/admin/page-content-editor'
import CategoryPagesEditor from '@/components/admin/category-pages-editor'
import ProductSlugEditor from '@/components/admin/product-slug-editor'
import NavbarBlock from '@/components/admin/navbar-block'

/* =========================================================
   ONGLET — CONTENU DU SITE (hero + collections)
   ========================================================= */
const DEFAULT_CONTENT = {
  hero: {
    layout: 'full-image',
    textPosition: 'bottom-left',
    overlayIntensity: 30,
    eyebrow: 'Nouvelle Collection · Automne-Hiver 2025',
    title: 'L\u2019art discret\nde la maison.',
    subtitle: 'Plaids crochet, macramé mural, poterie tournée main — chaque pièce imaginée, fabriquée et assemblée à la main.',
    ctaPrimary: { label: 'Découvrir la collection', href: '/collections?cat=nouveautes' },
    ctaSecondary: { label: 'À propos', href: '/a-propos' },
    signature: 'Plaid Sylvestre · Crochet main',
    image: '',
    showEyebrow: true,
    showTitle: true,
    showSubtitle: true,
    showPrimary: true,
    showSecondary: true,
    showSignature: true,
    // V2
    useCustomPosition: false,
    textCoords: { x: 8, y: 65 },
    textAlign: 'left',
    textColorMode: 'auto',
    heroTextColor: 'white',
    parallaxEnabled: false,
    parallaxIntensity: 25,
  },
  heroSlides: [],
  rotationInterval: 5000,
  sectionTitle: 'Deux collections, une même main.',
  sectionEyebrow: 'Nos collections',
  collections: [
    { key: 'intemporels',  name: 'Les Intemporels',          tagline: 'Plaids · Coussins · Paniers · Tapis · Macramés', image: '/api/img/jlt-plaid-01' },
    { key: 'pe-2026-2027', name: 'Printemps/Été 2026-2027', tagline: 'Coton · Trapilho · Rafia',                         image: 'https://images.pexels.com/photos/6208095/pexels-photo-6208095.jpeg?auto=compress&cs=tinysrgb&w=1400' },
  ],
  sections: HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } })),
  mediaLibrary: [],
  // Page "À propos" — image hero éditable depuis le CMS
  about: {
    heroImage: '',
    heroImageAlt: 'Atelier JLT — créations faites main',
  },
}

const DEFAULT_SETTINGS = {
  brand: {
    name: 'Atelier JLT',
    tagline: '',
    email: 'contact@atelierjlt.fr',
    phone: '',
    address: '',
  },
  shipping: {
    labelProvider: 'simple', // simple | colissimo | aggregator
    senderName: 'Atelier JLT',
    senderAddress: '',
    senderAddress2: '',
    senderZip: '',
    senderCity: '',
    senderCountry: '',
    senderPhone: '',
    senderEmail: '',
    returnDelayDays: 14,
    returnInstructions: "Un article ne vous convient pas ? Cochez-le ci-dessous, indiquez le motif, et glissez ce bordereau dans le colis de retour. Merci d’écrire à contact@atelierjlt.fr avant tout renvoi.",
  },
  social: {
    instagram: 'https://www.instagram.com/atelier.jlt/',
    facebook: 'https://www.facebook.com/atelier.jlt/',
    pinterest: '',
  },
  marquee: {
    line1: 'Fait main en France',
    line2: 'Fabrication française',
    line3: 'Emballage soigné',
  },
}


import { cn } from '@/lib/utils'

export default function AdminPage() {
  const [status, setStatus] = useState('loading') // loading | out | in
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [contentDirty, setContentDirty] = useState(false)

  useEffect(() => {
    fetch('/api/auth/admin-status', { credentials: 'include' }).then((r) => r.json()).then((d) => setStatus(d.isAdmin ? 'in' : 'out'))
  }, [])

  const login = async (e) => {
    e.preventDefault()
    const r = await fetch('/api/auth/admin-login', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (r.ok) { setStatus('in'); toast.success('Connecté en admin') }
    else toast.error('Mot de passe invalide')
  }

  const logout = async () => {
    await fetch('/api/auth/admin-logout', { method: 'POST', credentials: 'include' })
    setStatus('out')
  }

  if (status === 'loading') return <div className="min-h-screen bg-ivory" />

  if (status === 'out') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={login} className="w-full max-w-sm">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Espace atelier</span>
          <h1 className="font-display font-bold text-4xl mt-3">Back-office</h1>
          <p className="text-ink/60 mt-3 text-sm">Accès réservé à l'équipe JLT.</p>
          <div className="mt-8">
            <label className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Mot de passe admin</label>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full mt-2 bg-transparent border-b border-ink/30 focus:border-ink outline-none py-3" autoFocus required />
          </div>
          <button className="w-full mt-8 bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition">Entrer</button>
        </motion.form>
      </div>
    )
  }

  const groups = [
    { title: 'Vue générale', items: [{ key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard }] },
    { title: 'Site & contenu', items: [
      { key: 'content', label: 'Éditeur du site', icon: Layers },
      { key: 'blog', label: 'Journal', icon: BookOpen },
      { key: 'legal', label: 'Menu, footer & pages', icon: FileText },
      { key: 'settings', label: 'Identité & paramètres', icon: SettingsIcon },
    ] },
    { title: 'Boutique', items: [
      { key: 'products', label: 'Produits', icon: Package },
      { key: 'orders', label: 'Commandes', icon: ShoppingBag },
      { key: 'coupons', label: 'Codes promo', icon: Ticket },
    ] },
    { title: 'Audience', items: [
      { key: 'users', label: 'Clients', icon: Users },
      { key: 'newsletter', label: 'Newsletter', icon: Mail },
    ] },
  ]
  const activeLabel = groups.flatMap((group) => group.items).find((item) => item.key === tab)?.label
  const selectTab = (key) => {
    if (key !== tab && tab === 'content' && contentDirty && !window.confirm('Des modifications de l’éditeur du site ne sont pas enregistrées. Quitter sans enregistrer ?')) return
    setTab(key)
    setMobileNavOpen(false)
    if (key !== 'content') setContentDirty(false)
  }
  const navigation = (
    <nav aria-label="Navigation de l’administration" className="space-y-7">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 mb-2 text-[10px] uppercase tracking-[0.22em] text-ink/45">{group.title}</p>
          <div className="space-y-1">
            {group.items.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" onClick={() => selectTab(key)} aria-current={tab === key ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition ${tab === key ? 'bg-emerald text-ivory' : 'text-ink/75 hover:bg-linen/50 hover:text-ink'}`}>
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />{label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-linen sticky top-0 bg-ivory/95 backdrop-blur z-30">
        <div className="px-5 lg:px-8 flex items-center justify-between h-16 gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button type="button" className="lg:hidden border border-linen px-3 py-2 text-xs" onClick={() => setMobileNavOpen(!mobileNavOpen)} aria-expanded={mobileNavOpen} aria-controls="admin-mobile-nav">Menu</button>
            <div className="font-display text-lg sm:text-xl font-black truncate">Atelier <span className="text-emerald">JLT</span> <span className="font-normal text-ink/40">/ Admin</span></div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden sm:flex items-center gap-2 text-xs hover:text-emerald"><Eye className="h-4 w-4" /> Voir le site</a>
            <button onClick={logout} className="flex items-center gap-2 text-xs text-ink/60 hover:text-terracotta" aria-label="Déconnexion"><LogOut className="h-4 w-4" strokeWidth={1.5} /><span className="hidden sm:inline">Déconnexion</span></button>
          </div>
        </div>
        {mobileNavOpen && <div id="admin-mobile-nav" className="lg:hidden border-t border-linen p-5 max-h-[70vh] overflow-auto">{navigation}</div>}
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="hidden lg:block w-64 shrink-0 border-r border-linen bg-cream/30 p-5" aria-label="Espaces d’administration">{navigation}</aside>
        <main className="min-w-0 flex-1 px-5 py-8 lg:px-10 lg:py-10">
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/45 mb-5">Atelier JLT / {activeLabel}</div>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {tab === 'dashboard' && <TabDashboard />}
            {tab === 'content' && <TabContent onDirtyChange={setContentDirty} />}
            {tab === 'products' && <TabProducts />}
            {tab === 'blog' && <TabBlog />}
            {tab === 'legal' && <LegalPagesTab />}
            {tab === 'orders' && <TabOrders />}
            {tab === 'coupons' && <TabCoupons />}
            {tab === 'newsletter' && <TabNewsletter />}
            {tab === 'users' && <TabUsers />}
            {tab === 'settings' && <TabSettings />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="border border-linen p-6">
      <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50">{label}</div>
      <div className="font-display text-4xl mt-2 tabular-nums">{value}</div>
    </div>
  )
}

function TabDashboard() {
  const [s, setS] = useState(null)
  const load = () => fetch('/api/admin/stats', { credentials: 'include' }).then((r) => r.json()).then(setS)
  useEffect(() => { load() }, [])
  const archive = async () => {
    if (!confirm(`Retirer les ${s.unpaidCount} commande${s.unpaidCount > 1 ? 's' : ''} d’essai non payée${s.unpaidCount > 1 ? 's' : ''} ?\n\nElles disparaissent de la liste des commandes (une copie est conservée en archive).`)) return
    const r = await fetch('/api/admin/stats/archive-unpaid', { method: 'POST', credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return toast.error('Opération impossible')
    toast.success(`${d.archived} commande${d.archived > 1 ? 's' : ''} d’essai retirée${d.archived > 1 ? 's' : ''}`)
    load()
  }
  if (!s) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Tableau de bord</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat label="Chiffre d'affaires" value={formatPrice(s.revenue || 0)} />
        <Stat label="Commandes payées" value={s.orderCount} />
        <Stat label="Produits" value={s.productCount} />
        <Stat label="Clients" value={s.userCount} />
        <Stat label="Newsletter" value={s.newsletterCount} />
      </div>
      <p className="text-xs text-ink/55 mt-3">Seules les commandes réellement payées comptent dans le chiffre d’affaires.</p>
      {s.unpaidCount > 0 && (
        <div className="mt-4 border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center gap-3 text-sm" data-testid="unpaid-orders">
          <span className="flex-1 min-w-[240px] text-amber-900">
            {s.unpaidCount} commande{s.unpaidCount > 1 ? 's' : ''} d’essai non payée{s.unpaidCount > 1 ? 's' : ''} {s.unpaidCount > 1 ? 'restent' : 'reste'} dans la liste des commandes (elles ne sont pas comptées ci-dessus).
          </span>
          <button onClick={archive} data-testid="archive-unpaid" className="border border-amber-400 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-amber-900 hover:bg-amber-100">
            Retirer les commandes d’essai
          </button>
        </div>
      )}
    </div>
  )
}

function TabProducts() {
  const [products, setProducts] = useState(null)
  const [editing, setEditing] = useState(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [selected, setSelected] = useState(() => new Set())
  const [waitingMap, setWaitingMap] = useState({})

  const load = () => fetch('/api/admin/products', { credentials: 'include' }).then((r) => r.json()).then((d) => setProducts(d.products))
  useEffect(() => {
    load()
    fetch('/api/admin/stock-alerts', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setWaitingMap(Object.fromEntries((d.summary || []).map((s) => [s.slug, s.count]))))
      .catch(() => {})
  }, [])

  // Modification groupée (Nouveau / Édition limitée)
  const bulk = async (set) => {
    const slugs = [...selected]
    const r = await fetch('/api/admin/products/bulk', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs, set }),
    })
    const d = await r.json().catch(() => ({}))
    if (r.ok) {
      toast.success(`${d.updated} produit${d.updated > 1 ? 's' : ''} mis à jour`)
      setSelected(new Set())
      load()
    } else toast.error(d.error || 'Erreur')
  }

  // Produits filtrés par recherche + catégorie — permet à la fille de trouver
  // instantanément « Plaid Sylvestre » sans faire défiler toute la liste.
  const filtered = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (catFilter !== 'all' && p.category !== catFilter) return false
      if (!q) return true
      const hay = `${p.name} ${p.slug} ${p.category}`.toLowerCase()
      return hay.includes(q)
    })
  }, [products, search, catFilter])

  const cats = useMemo(() => {
    if (!products) return []
    const set = new Set(products.map((p) => p.category).filter(Boolean))
    return Array.from(set).sort()
  }, [products])

  const save = async (p) => {
    const r = await fetch('/api/admin/products?slug=' + p.slug, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (r.ok) {
      const d = await r.json().catch(() => ({}))
      toast.success('Enregistré'); setEditing(null); load()
      if (d.slug && d.slug !== p.slug) toast.message(`Adresse web : /produit/${d.slug}`)
      const sa = d.stockAlerts
      if (sa?.sent) toast.success(`${sa.sent} client${sa.sent > 1 ? 's' : ''} prévenu${sa.sent > 1 ? 's' : ''} du retour en stock`)
      else if (sa?.ready && !sa.configured) toast.message(`${sa.ready} alerte${sa.ready > 1 ? 's' : ''} retour en stock en attente : envoi des emails pas encore activé`)
    }
    else toast.error('Erreur')
  }

  const remove = async (slug) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch('/api/admin/products?slug=' + slug, { method: 'DELETE', credentials: 'include' })
    toast.success('Supprimé')
    load()
  }

  const resetPhotos = async (slug, name) => {
    if (!confirm(`Réinitialiser toutes les photos de « ${name} » aux valeurs par défaut du catalogue ?\n\nLes photos que vous aviez uploadées ne s'afficheront plus (elles restent dans la médiathèque). Réversible via le bouton Annuler dans le chat Juliette.`)) return
    try {
      const r = await fetch('/api/admin/reset-product-photos', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      })
      const data = await r.json()
      if (r.ok && data.ok) {
        toast.success(data.message || 'Photos réinitialisées')
        load()
      } else {
        toast.error(data.error || 'Impossible de réinitialiser')
      }
    } catch (e) {
      toast.error('Erreur réseau')
    }
  }

  const create = async () => {
    const r = await fetch('/api/admin/products', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Nouvelle création',
        category: 'intemporels', price: 0, stock: 1,
      }),
    })
    if (r.ok) { toast.success('Créé'); load() }
  }

  const mismatchCount = (products || []).filter((p) => stockMismatch(p)).length
  const alignStocks = async () => {
    const list = (products || []).filter((p) => stockMismatch(p))
    const lines = list.slice(0, 12).map((p) => { const m = stockMismatch(p); return `• ${p.name} : ${m.total} → ${m.sum}` }).join('\n')
    if (!confirm(`Aligner le stock total sur la somme des couleurs / tailles pour ${list.length} produit${list.length > 1 ? 's' : ''} ?\n\n${lines}${list.length > 12 ? '\n…' : ''}`)) return
    const r = await fetch('/api/admin/products/align-stock', { method: 'POST', credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return toast.error('Alignement impossible')
    toast.success(`${d.fixed?.length || 0} stock${(d.fixed?.length || 0) > 1 ? 's' : ''} aligné${(d.fixed?.length || 0) > 1 ? 's' : ''}`)
    load()
  }

  if (!products) return <div className="text-ink/50">Chargement…</div>

  const CAT_LABELS = PRODUCT_CATEGORY_LABELS

  return (
    <div>
      {/* Bandeau récupération photos manquantes (auto-hidden si 0) */}
      <MissingMediaRecovery />

      <StockAlertsPanel products={products} />

      {/* En-tête + action principale */}
      <div className="flex items-center justify-between mb-4 mt-8 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Produits <span className="text-ink/40 font-normal text-xl">({filtered.length} / {products.length})</span></h2>
          <p className="text-xs text-ink/60 mt-1">Toute la boutique est ici. Cherchez un produit par son nom pour le trouver vite.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mismatchCount > 0 && (
            <button onClick={alignStocks} data-testid="align-stocks" className="border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-[11px] uppercase tracking-[0.2em] hover:bg-amber-100 transition">
              Aligner les stocks ({mismatchCount})
            </button>
          )}
          <button onClick={create} className="bg-ink text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition flex items-center gap-2">
            <Plus className="h-4 w-4" strokeWidth={1.5} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Barre de recherche + filtres de catégorie */}
      <div className="bg-cream/50 border border-linen p-3 md:p-4 mb-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit (ex. plaid sylvestre, coussin, panier…)"
            className="w-full bg-ivory border border-ink/15 pl-10 pr-10 py-2.5 text-sm rounded-sm focus:outline-none focus:border-emerald"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-ink/50 hover:text-ink"
              aria-label="Effacer la recherche"
              type="button"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className="flex gap-1 p-1 bg-ivory border border-ink/15 rounded-sm overflow-x-auto">
          {['all', ...cats].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] rounded-sm whitespace-nowrap transition ${
                catFilter === c ? 'bg-ink text-ivory' : 'text-ink/60 hover:text-ink'
              }`}
            >
              {c === 'all' ? 'Toutes' : CAT_LABELS[c] || c}
            </button>
          ))}
        </div>
      </div>

      {/* Résultat vide */}
      {filtered.length === 0 && (
        <div className="border border-dashed border-ink/20 bg-cream/40 p-8 text-center">
          <p className="text-sm text-ink/60">Aucun produit ne correspond à votre recherche.</p>
          {search && (
            <button onClick={() => { setSearch(''); setCatFilter('all') }} className="mt-3 text-[10px] uppercase tracking-[0.22em] text-emerald hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      )}

      {/* Barre d'actions groupées */}
      {filtered.length > 0 && (
        <div className={`sticky top-0 z-10 mb-3 border p-3 flex flex-wrap items-center gap-2 ${selected.size ? 'bg-emerald/5 border-emerald' : 'bg-ivory border-linen'}`} data-testid="bulk-bar">
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none mr-2">
            <input
              type="checkbox"
              className="h-5 w-5 accent-emerald"
              checked={filtered.length > 0 && filtered.every((p) => selected.has(p.slug))}
              onChange={(e) => {
                const next = new Set(selected)
                filtered.forEach((p) => (e.target.checked ? next.add(p.slug) : next.delete(p.slug)))
                setSelected(next)
              }}
              data-testid="bulk-select-all"
            />
            {selected.size ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}` : 'Tout sélectionner'}
          </label>
          {selected.size > 0 && (
            <>
              <button type="button" onClick={() => bulk({ isNew: true })} data-testid="bulk-new-on" className="h-10 px-3 bg-emerald text-ivory text-[10px] uppercase tracking-[0.18em] hover:bg-emeraldDark">Marquer « Nouveau »</button>
              <button type="button" onClick={() => bulk({ isNew: false })} data-testid="bulk-new-off" className="h-10 px-3 border border-ink/20 text-[10px] uppercase tracking-[0.18em] hover:border-ink">Retirer « Nouveau »</button>
              <button type="button" onClick={() => bulk({ isLimited: true })} className="h-10 px-3 border border-ink/20 text-[10px] uppercase tracking-[0.18em] hover:border-ink">Marquer « Édition limitée »</button>
              <button type="button" onClick={() => bulk({ isLimited: false })} className="h-10 px-3 border border-ink/20 text-[10px] uppercase tracking-[0.18em] hover:border-ink">Retirer « Édition limitée »</button>
              <button type="button" onClick={() => setSelected(new Set())} className="h-10 px-3 text-[10px] uppercase tracking-[0.18em] text-ink/55 hover:text-ink">Annuler</button>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((p) => {
          const units = availableUnits(p)
          const lowItems = lowStockItems(p)
          const waiting = waitingMap[p.slug] || 0
          const mismatch = stockMismatch(p)
          return (
          <div key={p.slug} className={`border bg-ivory ${selected.has(p.slug) ? 'border-emerald' : 'border-linen'}`} data-testid={`admin-product-${p.slug}`}>
            <div className="flex items-center gap-4 p-3 flex-wrap sm:flex-nowrap">
              <input
                type="checkbox"
                className="h-5 w-5 accent-emerald flex-none"
                checked={selected.has(p.slug)}
                onChange={() => { const n = new Set(selected); n.has(p.slug) ? n.delete(p.slug) : n.add(p.slug); setSelected(n) }}
                aria-label={`Sélectionner ${p.name}`}
                data-testid={`select-${p.slug}`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images?.[0]} alt="" className="w-16 h-16 object-cover bg-cream" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight">{p.name}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">{CAT_LABELS[p.category] || p.category || '—'} · /produit/{p.slug}</div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {p.isNew && <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-emerald/10 text-emerald">Nouveau</span>}
                  {p.isLimited && <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-brique/10 text-brique">Édition limitée</span>}
                  {units === 0 && <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-ink text-ivory">Épuisé</span>}
                  {lowItems.length > 0 && (
                    <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-terracotta/15 text-terracotta" title={lowItems.map((i) => `${i.name} : ${i.stock}`).join(' · ')}>
                      Stock faible · {lowItems.map((i) => `${i.name} (${i.stock})`).join(', ')}
                    </span>
                  )}
                  {mismatch && (
                    <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-amber-100 text-amber-800" data-testid={`stock-mismatch-${p.slug}`} title="Le stock total ne correspond pas à la somme des couleurs / tailles">
                      Stock à vérifier · total {mismatch.total} ≠ {mismatch.by} {mismatch.sum}
                    </span>
                  )}
                  {waiting > 0 && <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 bg-cream border border-linen" data-testid={`waiting-${p.slug}`}>🔔 {waiting} en attente</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg tabular-nums">{formatPrice(p.price)}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">Stock : {units}</div>
              </div>
              <button onClick={() => setEditing(editing === p.slug ? null : p.slug)} className="text-[11px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 hover:border-ink transition">
                {editing === p.slug ? 'Fermer' : 'Modifier'}
              </button>
              <button
                onClick={() => resetPhotos(p.slug, p.name)}
                className="text-[11px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 text-ink/70 hover:border-terracotta hover:text-terracotta transition"
                title="Retirer toutes les photos uploadées et remettre celles du catalogue par défaut"
              >
                Réinit. photos
              </button>
              <button onClick={() => remove(p.slug)} className="text-terracotta hover:opacity-70" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            {editing === p.slug && <ProductEditor product={p} onSave={save} onSlugChanged={(ns) => { setEditing(ns); load() }} />}
          </div>
          )
        })}
      </div>
    </div>
  )
}

const PRODUCT_CATEGORY_LABELS = { intemporels: 'Les Intemporels', 'pe-2026-2027': 'Printemps/Été 2027', decoration: 'Décoration', nouveautes: 'Nouveautés' }

function ProductEditor({ product, onSave, onSlugChanged }) {
  const [p, setP] = useState({ ...product })
  const upd = (k, v) => setP({ ...p, [k]: v })
  const editMismatch = stockMismatch(p)
  return (
    <div className="p-4 border-t border-linen bg-cream/30">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Nom"><input value={p.name || ''} onChange={(e) => upd('name', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Prix (€)"><input type="number" value={p.price || 0} onChange={(e) => upd('price', Number(e.target.value))} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Stock total">
          <input type="number" min={0} value={p.stock ?? 0} onChange={(e) => upd('stock', Math.max(0, Number(e.target.value)))} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" data-testid="edit-stock" />
          {editMismatch && (
            <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-900 p-2 leading-relaxed" data-testid="edit-stock-mismatch">
              Le total ({editMismatch.total}) ne correspond pas aux {editMismatch.by} ({editMismatch.sum}). Le site ne vend jamais plus que le plus petit des deux.{' '}
              <button type="button" onClick={() => upd('stock', editMismatch.sum)} className="underline font-medium hover:text-emerald" data-testid="edit-stock-align">
                Mettre {editMismatch.sum}
              </button>
            </div>
          )}
        </Field>
        <Field label="Collection">
          <select value={p.category || ''} onChange={(e) => upd('category', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" data-testid="edit-category">
            <option value="intemporels">Les Intemporels</option>
            <option value="pe-2026-2027">Printemps/Été 2027</option>
            {p.category && !['intemporels', 'pe-2026-2027'].includes(p.category) && (
              <option value={p.category}>{PRODUCT_CATEGORY_LABELS[p.category] || p.category} (dans aucune collection)</option>
            )}
          </select>
        </Field>
        <Field label="Matière"><input value={p.material || ''} onChange={(e) => upd('material', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Couleur"><input value={p.color || ''} onChange={(e) => upd('color', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Dimensions"><input value={p.dimensions || ''} onChange={(e) => upd('dimensions', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Poids"><input value={p.weight || ''} onChange={(e) => upd('weight', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Fabrication (heures)"><input value={p.makingTime || ''} onChange={(e) => upd('makingTime', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.isNew} onChange={(e) => upd('isNew', e.target.checked)} /> Nouveauté</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!p.isLimited} onChange={(e) => upd('isLimited', e.target.checked)} /> Édition limitée</label>
      </div>
      <Field label="Description narrative (story)">
        <textarea rows={4} value={p.story || ''} onChange={(e) => upd('story', e.target.value)} className="w-full mt-1 bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm" />
      </Field>
      <Field label="Entretien">
        <textarea rows={2} value={p.care || ''} onChange={(e) => upd('care', e.target.value)} className="w-full mt-1 bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm" />
      </Field>
      <Field label="Tailles (Ø petit / moyen / grand — optionnel)">
        <SizesEditor sizes={p.sizes || []} onChange={(sz) => upd('sizes', sz)} />
      </Field>
      <Field label="Couleurs disponibles (variantes)">
        <VariantsEditor slug={p.slug} variants={p.variants || []} onChange={(vs) => upd('variants', vs)} />
      </Field>
      <Field label="Photos du produit">
        <ImageUploader images={p.images || []} onChange={(imgs) => upd('images', imgs)} />
      </Field>
      <ProductSlugEditor product={product} name={p.name} story={p.story} onChanged={onSlugChanged} />
      <button onClick={() => onSave(p)} className="mt-4 bg-ink text-ivory px-6 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition flex items-center gap-2">
        <Save className="h-4 w-4" strokeWidth={1.5} /> Enregistrer
      </button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="mt-4">
      <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

/**
 * Ligne d'un élément composable du hero.
 * - Case à cocher "Afficher" à gauche
 * - Libellé + champ éditable
 * - Bouton "×" (Vider le champ) à droite
 * L'ensemble est visuellement grisé quand l'élément est masqué.
 */
function HeroElementRow({ show, onToggle, label, onClear, children }) {
  return (
    <div className={`border ${show ? 'border-linen bg-cream/20' : 'border-dashed border-ink/15 bg-ink/[0.02]'} p-4 transition`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!show}
            onChange={(e) => onToggle(e.target.checked)}
            className="h-4 w-4"
          />
          <span className={`text-[11px] uppercase tracking-[0.22em] ${show ? 'text-emerald' : 'text-ink/40'}`}>
            {show ? '👁 Affiché' : '👁‍🗨 Masqué'}
          </span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-ink/70 ml-2">{label}</span>
        </label>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            title={`Vider "${label}"`}
            aria-label={`Vider ${label}`}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-terracotta hover:opacity-70 transition"
          >
            <Trash2 className="h-3 w-3" strokeWidth={2} /> Vider
          </button>
        )}
      </div>
      <div className={show ? '' : 'opacity-50 pointer-events-none'}>
        {children}
      </div>
    </div>
  )
}

function SizesEditor({ sizes, onChange }) {
  const list = sizes || []
  const set = (i, k, v) => {
    const next = list.slice()
    next[i] = { ...next[i], [k]: v }
    onChange(next)
  }
  const add = () => {
    const suggestions = ['Ø Petit', 'Ø Moyen', 'Ø Grand']
    const label = suggestions[list.length] || 'Nouvelle taille'
    onChange([...list, { label, dimensions: '', price: 0, stock: 0, isDefault: list.length === 0 }])
  }
  const remove = (i) => {
    const next = list.slice()
    next.splice(i, 1)
    // Assure au moins 1 taille par défaut si la liste n'est pas vide
    if (next.length && !next.some((s) => s.isDefault)) next[0].isDefault = true
    onChange(next)
  }
  const setDefault = (i) => {
    onChange(list.map((s, k) => ({ ...s, isDefault: k === i })))
  }
  if (list.length === 0) {
    return (
      <div className="mt-1 border border-dashed border-ink/20 p-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50 mb-3">
          Aucune taille définie — laisser vide si le produit n’a pas de déclinaison
        </p>
        <button
          type="button"
          onClick={add}
          className="text-[11px] uppercase tracking-[0.22em] px-4 py-2 border border-ink/30 hover:border-emerald hover:text-emerald transition"
        >
          + Ajouter une taille
        </button>
      </div>
    )
  }
  return (
    <div className="mt-1 space-y-2">
      <div className="grid grid-cols-[140px_1fr_100px_80px_90px_40px] gap-2 items-center text-[10px] uppercase tracking-[0.22em] text-ink/50 px-1">
        <span>Libellé</span>
        <span>Dimensions</span>
        <span>Prix (€)</span>
        <span>Stock</span>
        <span>Défaut</span>
        <span></span>
      </div>
      {list.map((s, i) => (
        <div key={i} className="grid grid-cols-[140px_1fr_100px_80px_90px_40px] gap-2 items-center border border-linen p-2 bg-ivory">
          <input
            value={s.label || ''}
            onChange={(e) => set(i, 'label', e.target.value)}
            placeholder="Ø Petit"
            className="bg-transparent border-b border-ink/15 py-1.5 text-sm focus:outline-none focus:border-ink"
          />
          <input
            value={s.dimensions || ''}
            onChange={(e) => set(i, 'dimensions', e.target.value)}
            placeholder="Ø 28 × H 26 cm"
            className="bg-transparent border-b border-ink/15 py-1.5 text-sm focus:outline-none focus:border-ink"
          />
          <input
            type="number"
            value={s.price ?? 0}
            onChange={(e) => set(i, 'price', Number(e.target.value))}
            className="bg-transparent border-b border-ink/15 py-1.5 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
          <input
            type="number"
            value={s.stock ?? 0}
            onChange={(e) => set(i, 'stock', Number(e.target.value))}
            className="bg-transparent border-b border-ink/15 py-1.5 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
          <label className="flex items-center gap-2 text-[11px] cursor-pointer">
            <input
              type="radio"
              name="size-default"
              checked={!!s.isDefault}
              onChange={() => setDefault(i)}
            />
            <span className="text-ink/60">défaut</span>
          </label>
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Supprimer la taille"
            className="text-terracotta hover:opacity-70 justify-self-end"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-[11px] uppercase tracking-[0.22em] px-4 py-2 border border-ink/30 hover:border-emerald hover:text-emerald transition"
      >
        + Ajouter une taille
      </button>
    </div>
  )
}

function TabBlog() {
  const [posts, setPosts] = useState(null)
  const [editing, setEditing] = useState(null) // slug being edited
  const [creating, setCreating] = useState(false)

  const load = () =>
    fetch('/api/admin/blog', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
  useEffect(() => { load() }, [])

  const save = async (data, isNew) => {
    if (isNew) {
      const r = await fetch('/api/admin/blog', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const d = await r.json()
      if (r.ok) { toast.success('Article créé'); setCreating(false); load() }
      else toast.error(d.error || 'Erreur')
    } else {
      const r = await fetch('/api/admin/blog?slug=' + encodeURIComponent(data.slug), {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (r.ok) { toast.success('Article enregistré'); setEditing(null); load() }
      else toast.error('Erreur')
    }
  }

  const remove = async (slug) => {
    if (!confirm('Supprimer cet article définitivement ?')) return
    await fetch('/api/admin/blog?slug=' + encodeURIComponent(slug), {
      method: 'DELETE', credentials: 'include',
    })
    toast.success('Supprimé')
    load()
  }

  const togglePublish = async (post) => {
    const nextPublished = !post.published
    await fetch('/api/admin/blog?slug=' + encodeURIComponent(post.slug), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: nextPublished }),
    })
    toast.success(nextPublished ? 'Publié' : 'Dépublié')
    load()
  }

  if (creating) {
    return (
      <BlogEditor
        initial={{
          slug: '', title: '', category: 'Journal', excerpt: '', image: '', imageAlt: '',
          content: '', keywords: [], author: 'Atelier JLT', readingTime: '5 min',
          metaTitle: '', metaDescription: '', published: false,
        }}
        onSave={(d) => save(d, true)}
        onCancel={() => setCreating(false)}
        isNew
      />
    )
  }
  if (editing) {
    const post = posts?.find((p) => p.slug === editing)
    if (!post) return null
    return (
      <BlogEditor
        initial={post}
        onSave={(d) => save(d, false)}
        onCancel={() => setEditing(null)}
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-4xl">Journal</h2>
          <p className="text-ink/60 text-sm mt-1">Articles publiés sur /journal.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-emerald text-ivory px-6 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-emeraldDark transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Nouvel article
        </button>
      </div>

      {posts === null ? (
        <div className="text-ink/50 italic">Chargement…</div>
      ) : posts.length === 0 ? (
        <div className="border border-dashed border-ink/20 p-12 text-center">
          <p className="text-ink/60 mb-4">Aucun article pour l&rsquo;instant.</p>
          <button
            onClick={() => setCreating(true)}
            className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 border border-ink/30 hover:border-emerald hover:text-emerald transition"
          >
            + Créer le premier article
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p.slug} className="border border-linen bg-ivory p-5 flex items-center gap-5">
              <div className="w-24 h-16 bg-cream flex-shrink-0 overflow-hidden">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30">
                    <FileText className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-terracotta">
                  <span>{p.category || 'Journal'}</span>
                  {p.published ? (
                    <span className="ml-2 inline-flex items-center gap-1 bg-emerald text-ivory px-2 py-0.5">
                      <Eye className="h-3 w-3" strokeWidth={1.5} /> Publié
                    </span>
                  ) : (
                    <span className="ml-2 inline-flex items-center gap-1 bg-ink/60 text-ivory px-2 py-0.5">
                      <EyeOff className="h-3 w-3" strokeWidth={1.5} /> Brouillon
                    </span>
                  )}
                </div>
                <div className="font-display text-lg mt-1 truncate">{p.title}</div>
                <div className="text-[11px] text-ink/50 mt-0.5 truncate">/journal/{p.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePublish(p)}
                  title={p.published ? 'Dépublier' : 'Publier'}
                  className="p-2 hover:bg-linen/40 transition"
                >
                  {p.published ? <EyeOff className="h-4 w-4" strokeWidth={1.5} /> : <Eye className="h-4 w-4 text-emerald" strokeWidth={1.5} />}
                </button>
                <button
                  onClick={() => setEditing(p.slug)}
                  className="text-[10px] uppercase tracking-[0.22em] px-3 py-1.5 border border-ink/25 hover:border-emerald hover:text-emerald transition"
                >
                  Modifier
                </button>
                <button
                  onClick={() => remove(p.slug)}
                  className="text-terracotta hover:opacity-70"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BlogEditor({ initial, onSave, onCancel, isNew = false }) {
  const [p, setP] = useState({
    ...initial,
    keywords: Array.isArray(initial.keywords) ? initial.keywords.join(', ') : (initial.keywords || ''),
  })
  const upd = (k, v) => setP({ ...p, [k]: v })

  // Auto-generate slug from title when creating
  useEffect(() => {
    if (!isNew) return
    if (p.slug) return // don't override manual edits
    const s = (p.title || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    if (s) setP((prev) => ({ ...prev, slug: s }))
    // eslint-disable-next-line
  }, [p.title])

  const submit = () => {
    const payload = {
      ...p,
      keywords: (p.keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
    }
    if (!payload.title || !payload.slug) {
      toast.error('Titre et slug requis')
      return
    }
    onSave(payload)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.28em] text-terracotta">
            {isNew ? 'Nouvel article' : 'Modifier l’article'}
          </span>
          <h2 className="font-display text-3xl mt-1">{p.title || 'Sans titre'}</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 border border-ink/25 hover:bg-linen/50 transition">
            Annuler
          </button>
          <button
            onClick={submit}
            className="bg-emerald text-ivory px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-emeraldDark transition flex items-center gap-2"
          >
            <Save className="h-4 w-4" strokeWidth={1.5} /> Enregistrer
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Colonne principale */}
        <div className="space-y-6">
          <Field label="Titre de l’article">
            <input
              value={p.title || ''}
              onChange={(e) => upd('title', e.target.value)}
              placeholder="Ex : L’art du crochet contemporain"
              className="w-full bg-transparent border-b border-ink/20 py-3 text-xl font-display focus:outline-none focus:border-emerald"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Catégorie">
              <input
                value={p.category || ''}
                onChange={(e) => upd('category', e.target.value)}
                placeholder="Tendances, Savoir-faire, Manifeste…"
                className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="Slug (URL) — /journal/…">
              <input
                value={p.slug || ''}
                onChange={(e) => upd('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                placeholder="tendances-deco-2026"
                disabled={!isNew}
                className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-mono text-sm disabled:opacity-60"
              />
            </Field>
          </div>

          <Field label="Chapô (extrait affiché sur la liste)">
            <textarea
              rows={2}
              value={p.excerpt || ''}
              onChange={(e) => upd('excerpt', e.target.value)}
              placeholder="Une ou deux phrases qui donnent envie de lire l’article…"
              className="w-full bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm"
            />
          </Field>

          <Field label="Image d’ouverture (URL)">
            <ImageUploader
              images={p.image ? [p.image] : []}
              onChange={(imgs) => upd('image', imgs[0] || '')}
            />
            {p.image && (
              <input
                value={p.imageAlt || ''}
                onChange={(e) => upd('imageAlt', e.target.value)}
                placeholder="Texte alternatif de l’image (accessibilité + SEO)"
                className="w-full bg-transparent border-b border-ink/15 py-2 text-sm mt-3 focus:outline-none focus:border-ink"
              />
            )}
          </Field>

          <Field label="Contenu (Markdown)">
            <textarea
              rows={22}
              value={p.content || ''}
              onChange={(e) => upd('content', e.target.value)}
              placeholder={`## Un premier titre\n\nÉcrivez votre article ici. Utilisez la syntaxe Markdown :\n\n**gras**, *italique*, [lien](https://…), > citation.\n\n## Deuxième section\n\nParagraphe suivant…`}
              className="w-full bg-transparent border border-ink/15 p-4 font-mono text-sm leading-relaxed focus:outline-none focus:border-ink"
            />
            <p className="text-[11px] text-ink/40 mt-2">
              Astuce : <code>## Titre</code> pour un H2, <code>**mot**</code> pour du gras, <code>&gt; citation</code> pour un pullquote.
            </p>
          </Field>
        </div>

        {/* Colonne latérale — meta */}
        <div className="space-y-6">
          <div className="border border-linen bg-cream/40 p-5">
            <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-3">Publication</div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!p.published}
                onChange={(e) => upd('published', e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm">
                {p.published ? 'Publié sur le site' : 'Brouillon — non visible'}
              </span>
            </label>
          </div>

          <div className="border border-linen p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60">SEO</div>
            <Field label="Meta title (60 car. max)">
              <input
                value={p.metaTitle || ''}
                onChange={(e) => upd('metaTitle', e.target.value)}
                placeholder={p.title || 'Titre pour Google'}
                maxLength={70}
                className="w-full bg-transparent border-b border-ink/15 py-2 text-sm focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="Meta description (155 car. max)">
              <textarea
                rows={3}
                value={p.metaDescription || ''}
                onChange={(e) => upd('metaDescription', e.target.value)}
                placeholder={p.excerpt || 'Description affichée sur Google'}
                maxLength={170}
                className="w-full bg-transparent border border-ink/15 p-2 text-sm focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="Mots-clés (séparés par virgule)">
              <input
                value={p.keywords || ''}
                onChange={(e) => upd('keywords', e.target.value)}
                placeholder="crochet, décoration, artisanat"
                className="w-full bg-transparent border-b border-ink/15 py-2 text-sm focus:outline-none focus:border-ink"
              />
            </Field>
          </div>

          <div className="border border-linen p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Métadonnées</div>
            <Field label="Auteur">
              <input
                value={p.author || ''}
                onChange={(e) => upd('author', e.target.value)}
                className="w-full bg-transparent border-b border-ink/15 py-2 text-sm focus:outline-none focus:border-ink"
              />
            </Field>
            <Field label="Temps de lecture">
              <input
                value={p.readingTime || ''}
                onChange={(e) => upd('readingTime', e.target.value)}
                placeholder="5 min"
                className="w-full bg-transparent border-b border-ink/15 py-2 text-sm focus:outline-none focus:border-ink"
              />
            </Field>
          </div>

          {p.slug && !isNew && p.published && (
            <a
              href={`/journal/${p.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-emerald text-emerald px-4 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-emerald hover:text-ivory transition"
            >
              Voir sur le site →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}


function TabCoupons() {
  const [coupons, setCoupons] = useState(null)
  const [form, setForm] = useState({ code: '', type: 'percent', value: 10, label: '', active: true })
  const load = () => fetch('/api/admin/coupons', { credentials: 'include' }).then((r) => r.json()).then((d) => setCoupons(d.coupons))
  useEffect(() => { load() }, [])
  const create = async (e) => {
    e.preventDefault()
    await fetch('/api/admin/coupons', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    toast.success('Coupon créé')
    setForm({ code: '', type: 'percent', value: 10, label: '', active: true })
    load()
  }
  const remove = async (id) => {
    await fetch('/api/admin/coupons?id=' + id, { method: 'DELETE', credentials: 'include' })
    load()
  }
  if (!coupons) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Codes promo</h2>
      <form onSubmit={create} className="grid md:grid-cols-[1fr_140px_120px_1fr_140px] gap-3 border border-linen p-4 mb-6">
        <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" required />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-transparent border-b border-ink/20 py-2">
          <option value="percent">Pourcentage</option>
          <option value="fixed">Montant fixe</option>
        </select>
        <input type="number" placeholder="Valeur" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" required />
        <input placeholder="Libellé (ex: Bienvenue -10%)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" />
        <button className="bg-ink text-ivory px-4 py-2 text-[11px] uppercase tracking-[0.22em] hover:bg-terracotta transition">Créer</button>
      </form>
      {coupons.length === 0 ? <p className="text-ink/60">Aucun code promo actif.</p> : (
        <div className="space-y-2">
          {coupons.map((c) => (
            <div key={c._id} className="border border-linen p-4 flex items-center justify-between">
              <div>
                <div className="font-display text-xl tracking-wider">{c.code}</div>
                <div className="text-sm text-ink/60">{c.label || `${c.value}${c.type === 'percent' ? '%' : '€'} de réduction`}</div>
              </div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">{c.active ? 'Actif' : 'Inactif'}</div>
              <button onClick={() => remove(c._id)} className="text-terracotta hover:opacity-70"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TabNewsletter() {
  const [list, setList] = useState(null)
  useEffect(() => { fetch('/api/admin/newsletters', { credentials: 'include' }).then((r) => r.json()).then((d) => setList(d.list)) }, [])
  if (!list) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Newsletter ({list.length})</h2>
      <div className="space-y-1">
        {list.map((n) => (
          <div key={n._id} className="border-b border-linen py-3 flex items-center justify-between">
            <span>{n.email}</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">{new Date(n.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabUsers() {
  const [list, setList] = useState(null)
  useEffect(() => { fetch('/api/admin/users', { credentials: 'include' }).then((r) => r.json()).then((d) => setList(d.list)) }, [])
  if (!list) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Clients ({list.length})</h2>
      <div className="space-y-1">
        {list.map((u) => (
          <div key={u._id} className="border-b border-linen py-3 grid md:grid-cols-[1fr_1fr_120px_140px] gap-4 items-center">
            <span className="font-display text-lg">{u.name || '—'}</span>
            <span>{u.email}</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">{u.loyaltyPoints || 0} pts</span>
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink/50">{new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TabContent({ onDirtyChange }) {
  const [c, setC] = useState(null)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  useEffect(() => { onDirtyChange(dirty) }, [dirty, onDirtyChange])
  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  useEffect(() => {
    fetch('/api/admin/site-content', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const dbContent = d.content || {}
        const merged = { ...DEFAULT_CONTENT, ...dbContent }
        merged.sections = mergeHomepageSections(dbContent.sections)
        setC(merged)
      })
      .catch(() => setC({ ...DEFAULT_CONTENT, sections: mergeHomepageSections(null) }))
  }, [])

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/site-content', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
    })
    setSaving(false)
    if (r.ok) { setDirty(false); toast.success('Contenu enregistré') }
    else toast.error('Erreur')
  }

  const upd = (path, value) => {
    setDirty(true)
    setC((prev) => {
      const next = structuredClone(prev)
      const parts = path.split('.')
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] == null || typeof cur[parts[i]] !== 'object') {
          cur[parts[i]] = {}
        }
        cur = cur[parts[i]]
      }
      cur[parts[parts.length - 1]] = value
      return next
    })
  }

  const updColl = (idx, key, val) => {
    setDirty(true)
    setC((prev) => {
      const next = structuredClone(prev)
      next.collections[idx][key] = val
      return next
    })
  }

  if (!c) return <div className="text-ink/50">Chargement…</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="font-display text-3xl">Éditeur du site</h2>
          <p className="text-sm text-ink/60 mt-2">Accueil (bannière, sections), pages À propos, Collection Printemps/Été, Contact, Pages Collections et Médiathèque — tout le contenu du site au même endroit.</p>
          <p role="status" className="text-xs mt-2 text-ink/60">{dirty ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées'}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <a
            href="/?edit=1"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink text-ivory px-4 py-3 text-xs flex gap-2 items-center hover:bg-emerald transition"
            title="Édition visuelle directement sur la page (idéal iPad)"
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.5} /> Édition visuelle
          </a>
          <a href="/" target="_blank" rel="noopener noreferrer" className="border border-ink/20 px-4 py-3 text-xs flex gap-2 items-center hover:border-ink"><Eye className="h-4 w-4" /> Voir la page publiée</a>
          <button onClick={save} disabled={saving || !dirty} className="bg-emerald text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.18em] hover:bg-emeraldDark transition flex items-center gap-2 disabled:opacity-50">
            <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      <nav aria-label="Sections de l’éditeur" className="flex flex-wrap gap-2 mb-8">
        {[['#admin-navbar', 'Menu de navigation'], ['#admin-hero', 'Bannière principale'], ['#admin-sections', 'Sections de la page'], ['#admin-page-about', 'Page À propos'], ['#admin-page-collectionPE2027', 'Collection Printemps/Été 2027'], ['#admin-page-contact', 'Page Contact'], ['#admin-category-pages', 'Pages Intemporels / Nouveautés / Éditions limitées'], ['#admin-media', 'Médiathèque']].map(([href, label]) => (
          <a key={href} href={href} className="border border-linen bg-cream/40 px-3 py-2 text-xs hover:border-emerald hover:text-emerald transition">{label}</a>
        ))}
      </nav>
      <div className="space-y-10 max-w-5xl">
        {/* MENU DE NAVIGATION — enregistré séparément */}
        <NavbarBlock />
        {/* HERO — Compositeur V2 (WYSIWYG + contraste auto + multi-slides + parallaxe) */}
        <HeroComposer
          hero={c.hero}
          heroSlides={c.heroSlides || []}
          rotationInterval={c.rotationInterval || 5000}
          onChange={({ hero, heroSlides, rotationInterval }) => {
            setDirty(true)
            setC((prev) => ({ ...prev, hero, heroSlides, rotationInterval }))
          }}
          ImageUploader={ImageUploader}
        />

        {/* SECTIONS PAGE D'ACCUEIL — activation, ordre et contenu */}
        <div id="admin-sections" className="scroll-mt-24"><HomeSectionsEditor sections={c.sections} onChange={(next) => upd('sections', next)} /></div>

        {/* ===== PAGES SECONDAIRES — mêmes champs que l'édition visuelle (?edit=1) ===== */}
        <div className="space-y-4">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-ink/60">Pages du site</h3>
          <PageContentEditor pageKey="about" value={c.about} onChange={(next) => upd('about', next)} />
          <PageContentEditor pageKey="collectionPE2027" value={c.collectionPE2027} onChange={(next) => upd('collectionPE2027', next)} />
          <PageContentEditor pageKey="contact" value={c.contact} onChange={(next) => upd('contact', next)} />
          <CategoryPagesEditor />
        </div>

        <div id="admin-media" className="scroll-mt-24"><MediaLibrary files={c.mediaLibrary || []} onChange={(files) => upd('mediaLibrary', files)} /></div>

        <div className="text-[11px] text-ink/50 italic">
          ✨ Astuce : pour changer une photo, va d\u2019abord dans <b>Produits → Modifier</b> → <b>Photos du produit</b> pour uploader ta nouvelle image,
          puis copie l\u2019URL qui apparaît (ex. <code>/api/img/upload-xxxxxx</code>) et colle-la ici.
        </div>
      </div>
    </div>
  )
}

/* =========================================================
   Éditeur des sections modulaires de la page d'accueil
   ========================================================= */

/* =========================================================
   Bibliothèque de fichiers — téléchargement direct
   PNG · JPG · WEBP · MP4 · WEBM · PDF
   ========================================================= */

/* =========================================================
   Réglages de la boutique
   ========================================================= */
function TabSettings() {
  const [s, setS] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setS({ ...DEFAULT_SETTINGS, ...(d.settings || {}) }))
      .catch(() => setS({ ...DEFAULT_SETTINGS }))
  }, [])

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/settings', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    })
    setSaving(false)
    if (r.ok) toast.success('Paramètres enregistrés')
    else toast.error('Erreur')
  }

  const upd = (section, key, value) => {
    setS((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }))
  }

  if (!s) return <div className="text-ink/50">Chargement…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-3xl">Paramètres</h2>
        <button onClick={save} disabled={saving} className="bg-emerald text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-emeraldDark transition flex items-center gap-2 disabled:opacity-60">
          <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="space-y-8 max-w-3xl">
        <section className="border border-linen bg-ivory p-6">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-5">Marque</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nom"><input value={s.brand.name} onChange={(e) => upd('brand', 'name', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Baseline"><input value={s.brand.tagline} onChange={(e) => upd('brand', 'tagline', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Email de contact"><input type="email" value={s.brand.email} onChange={(e) => upd('brand', 'email', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Téléphone"><input value={s.brand.phone} onChange={(e) => upd('brand', 'phone', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Adresse / Région"><input value={s.brand.address} onChange={(e) => upd('brand', 'address', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
          </div>
        </section>

        <section className="border border-linen bg-ivory p-6">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-5">Réseaux sociaux</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Instagram (URL)"><input value={s.social.instagram} onChange={(e) => upd('social', 'instagram', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Facebook (URL)"><input value={s.social.facebook} onChange={(e) => upd('social', 'facebook', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Pinterest (URL)"><input value={s.social.pinterest} onChange={(e) => upd('social', 'pinterest', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
          </div>
        </section>

        <section className="border border-linen bg-ivory p-6" data-testid="settings-shipping">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-2">Expédition & bordereaux</h3>
          <p className="text-xs text-ink/60 mb-5 leading-relaxed">
            Informations imprimées sur les étiquettes 10 × 15 cm (Commandes → Imprimer). Laissez l’adresse vide si vous ne souhaitez afficher que le nom.
          </p>
          <Field label="Type d’étiquette">
            <div className="grid sm:grid-cols-3 gap-2 mt-1">
              {[
                ['simple', 'Étiquette à imprimer', 'Fonctionne tout de suite — affranchissement à La Poste'],
                ['colissimo', 'Colissimo affranchie', 'À connecter : compte Colissimo Entreprise requis'],
                ['aggregator', 'Boxtal / Sendcloud', 'À connecter : compte transporteur requis'],
              ].map(([v, label, hint]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => upd('shipping', 'labelProvider', v)}
                  className={`text-left p-3 border min-h-[72px] transition ${(s.shipping?.labelProvider || 'simple') === v ? 'border-emerald bg-emerald/5 ring-1 ring-emerald' : 'border-ink/15 hover:border-ink/40'}`}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[11px] text-ink/55 mt-1 leading-snug">{hint}</div>
                </button>
              ))}
            </div>
          </Field>
          {(s.shipping?.labelProvider || 'simple') !== 'simple' && (
            <p className="text-xs text-terracotta mt-3">
              Ce transporteur n’est pas encore connecté : l’étiquette simple à imprimer sera utilisée en attendant.
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            {[
              ['senderName', 'Nom de l’expéditeur'],
              ['senderPhone', 'Téléphone (facultatif)'],
              ['senderAddress', 'Adresse (facultatif)'],
              ['senderAddress2', 'Complément (facultatif)'],
              ['senderZip', 'Code postal (facultatif)'],
              ['senderCity', 'Ville (facultatif)'],
              ['senderCountry', 'Pays (facultatif)'],
              ['senderEmail', 'Email pour les retours (facultatif)'],
            ].map(([k, label]) => (
              <Field key={k} label={label}>
                <input value={s.shipping?.[k] || ''} onChange={(e) => upd('shipping', k, e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" />
              </Field>
            ))}
            <Field label="Délai de retour (jours)">
              <input type="number" min={0} value={s.shipping?.returnDelayDays ?? 14} onChange={(e) => upd('shipping', 'returnDelayDays', Number(e.target.value))} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" />
            </Field>
          </div>
          <Field label="Texte du bordereau de retour">
            <textarea rows={3} value={s.shipping?.returnInstructions || ''} onChange={(e) => upd('shipping', 'returnInstructions', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm" />
          </Field>
        </section>

        <section className="border border-linen bg-ivory p-6">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-5">Bandeau haut de site</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Message 1"><input value={s.marquee.line1} onChange={(e) => upd('marquee', 'line1', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Message 2"><input value={s.marquee.line2} onChange={(e) => upd('marquee', 'line2', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Message 3"><input value={s.marquee.line3} onChange={(e) => upd('marquee', 'line3', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
          </div>
        </section>
      </div>
    </div>
  )
}

