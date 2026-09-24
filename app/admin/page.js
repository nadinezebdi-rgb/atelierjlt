'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, Mail, LogOut, Plus, Trash2, Save, Ticket, FileText, Settings as SettingsIcon, Upload, BookOpen, Eye, EyeOff, Edit3, ArrowUp, ArrowDown, Layers, GripVertical, X, FolderOpen, Copy, Check, Film, Image as ImageIcon, Search, ArrowUpDown } from 'lucide-react'
import { HOMEPAGE_SECTION_DEFAULTS, mergeHomepageSections, BANNER_TEMPLATES } from '@/lib/homepage-sections'
import { cn } from '@/lib/utils'

export default function AdminPage() {
  const [status, setStatus] = useState('loading') // loading | out | in
  const [pw, setPw] = useState('')
  const [tab, setTab] = useState('dashboard')

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

  const tabs = [
    { key: 'dashboard',   label: 'Tableau de bord', icon: LayoutDashboard },
    { key: 'content',     label: 'Contenu du site', icon: FileText },
    { key: 'products',    label: 'Produits',        icon: Package },
    { key: 'blog',        label: 'Journal',         icon: BookOpen },
    { key: 'orders',      label: 'Commandes',       icon: ShoppingBag },
    { key: 'coupons',     label: 'Coupons',         icon: Ticket },
    { key: 'newsletter',  label: 'Newsletter',      icon: Mail },
    { key: 'users',       label: 'Clients',         icon: Users },
    { key: 'settings',    label: 'Paramètres',      icon: SettingsIcon },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-linen sticky top-0 bg-ivory/95 backdrop-blur z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="font-display text-xl font-black">Atelier <span className="text-emerald">JLT</span> — Admin</div>
            <div className="hidden md:flex items-center gap-1">
              {tabs.map((t) => (
                <button key={t.key} onClick={() => setTab(t.key)} className={`text-[11px] uppercase tracking-[0.22em] px-3 py-1.5 transition ${tab === t.key ? 'bg-ink text-ivory' : 'hover:bg-linen/50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-ink/60 hover:text-terracotta">
            <LogOut className="h-4 w-4" strokeWidth={1.5} /> Déconnexion
          </button>
        </div>
        <div className="md:hidden container pb-3 flex gap-1 overflow-auto no-scrollbar">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`text-[10px] uppercase tracking-[0.22em] px-3 py-1.5 whitespace-nowrap transition ${tab === t.key ? 'bg-ink text-ivory' : 'bg-linen/40'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="container py-10">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            {tab === 'dashboard' && <TabDashboard />}
            {tab === 'content' && <TabContent />}
            {tab === 'products' && <TabProducts />}
            {tab === 'blog' && <TabBlog />}
            {tab === 'orders' && <TabOrders />}
            {tab === 'coupons' && <TabCoupons />}
            {tab === 'newsletter' && <TabNewsletter />}
            {tab === 'users' && <TabUsers />}
            {tab === 'settings' && <TabSettings />}
          </motion.div>
        </AnimatePresence>
      </main>
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
  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' }).then((r) => r.json()).then(setS)
  }, [])
  if (!s) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Tableau de bord</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Stat label="Chiffre d'affaires" value={formatPrice(s.revenue || 0)} />
        <Stat label="Commandes" value={s.orderCount} />
        <Stat label="Produits" value={s.productCount} />
        <Stat label="Clients" value={s.userCount} />
        <Stat label="Newsletter" value={s.newsletterCount} />
      </div>
    </div>
  )
}

function TabProducts() {
  const [products, setProducts] = useState(null)
  const [editing, setEditing] = useState(null)

  const load = () => fetch('/api/admin/products', { credentials: 'include' }).then((r) => r.json()).then((d) => setProducts(d.products))
  useEffect(() => { load() }, [])

  const save = async (p) => {
    const r = await fetch('/api/admin/products?slug=' + p.slug, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    if (r.ok) { toast.success('Enregistré'); setEditing(null); load() }
    else toast.error('Erreur')
  }

  const remove = async (slug) => {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch('/api/admin/products?slug=' + slug, { method: 'DELETE', credentials: 'include' })
    toast.success('Supprimé')
    load()
  }

  const create = async () => {
    const r = await fetch('/api/admin/products', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'produit-' + Date.now(),
        name: 'Nouvelle création',
        category: 'decoration', price: 0, stock: 1,
      }),
    })
    if (r.ok) { toast.success('Créé'); load() }
  }

  if (!products) return <div className="text-ink/50">Chargement…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-3xl">Produits ({products.length})</h2>
        <button onClick={create} className="bg-ink text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition flex items-center gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Nouveau produit
        </button>
      </div>
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.slug} className="border border-linen bg-ivory">
            <div className="flex items-center gap-4 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images?.[0]} alt="" className="w-16 h-16 object-cover bg-cream" />
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg leading-tight">{p.name}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">{p.category} · {p.slug}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg tabular-nums">{formatPrice(p.price)}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">Stock : {p.stock}</div>
              </div>
              <button onClick={() => setEditing(editing === p.slug ? null : p.slug)} className="text-[11px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 hover:border-ink transition">
                {editing === p.slug ? 'Fermer' : 'Modifier'}
              </button>
              <button onClick={() => remove(p.slug)} className="text-terracotta hover:opacity-70" aria-label="Supprimer">
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            {editing === p.slug && <ProductEditor product={p} onSave={save} />}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProductEditor({ product, onSave }) {
  const [p, setP] = useState({ ...product })
  const upd = (k, v) => setP({ ...p, [k]: v })
  return (
    <div className="p-4 border-t border-linen bg-cream/30">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Nom"><input value={p.name || ''} onChange={(e) => upd('name', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Prix (€)"><input type="number" value={p.price || 0} onChange={(e) => upd('price', Number(e.target.value))} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Stock"><input type="number" value={p.stock || 0} onChange={(e) => upd('stock', Number(e.target.value))} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
        <Field label="Collection">
          <select value={p.category || ''} onChange={(e) => upd('category', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink">
            <option value="racine">Racine (plaids, coussins, paniers)</option>
            <option value="empreinte">Empreinte (tapis, macramé, suspensions)</option>
            <option value="terre">Terre (poterie, céramique)</option>
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
      <Field label="Photos du produit">
        <ImageUploader images={p.images || []} onChange={(imgs) => upd('images', imgs)} />
      </Field>
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


function TabOrders() {
  const [orders, setOrders] = useState(null)
  const load = () => fetch('/api/admin/orders', { credentials: 'include' }).then((r) => r.json()).then((d) => setOrders(d.orders))
  useEffect(() => { load() }, [])
  const updateStatus = async (id, status) => {
    await fetch('/api/admin/orders?id=' + id, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    toast.success('Statut mis à jour')
    load()
  }
  if (!orders) return <div className="text-ink/50">Chargement…</div>
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Commandes ({orders.length})</h2>
      {orders.length === 0 ? <p className="text-ink/60">Aucune commande pour l'instant.</p> : (
        <div className="space-y-2">
          {orders.map((o) => (
            <div key={o._id} className="border border-linen p-4 grid md:grid-cols-[1fr_180px_140px_180px] gap-4 items-center">
              <div>
                <div className="font-display text-lg">{o.orderNumber}</div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">{new Date(o.createdAt).toLocaleString('fr-FR')}</div>
                <div className="text-sm text-ink/70 mt-1">{o.items?.length || 0} article{(o.items?.length || 0) > 1 ? 's' : ''} · {o.address?.email || 'invité'}</div>
              </div>
              <div className="font-display text-xl tabular-nums">{formatPrice(o.total)}</div>
              <select value={o.status} onChange={(e) => updateStatus(o._id, e.target.value)} className="bg-transparent border border-ink/20 px-3 py-2 text-[11px] uppercase tracking-[0.22em] focus:outline-none focus:border-ink">
                {['received', 'preparing', 'shipped', 'delivered', 'cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50">{o.paymentStatus}</div>
            </div>
          ))}
        </div>
      )}
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

/* =========================================================
   COMPOSANT — Uploader d'images (multi-fichiers + URL manuelle)
   ========================================================= */
function ImageUploader({ images, onChange, accept = 'images' }) {
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)

  // accept: 'images' (par défaut) | 'all' (images + mp4 + pdf)
  const acceptAttr = accept === 'all'
    ? 'image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf'
    : 'image/png,image/jpeg,image/webp'

  const handleFiles = async (files) => {
    if (!files || !files.length) return
    setUploading(true)
    const uploaded = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json()
        if (r.ok && d.url) uploaded.push(d.url)
        else toast.error(d.error || 'Upload échoué')
      } catch (e) {
        toast.error('Upload échoué')
      }
    }
    setUploading(false)
    if (uploaded.length) {
      onChange([...(images || []), ...uploaded])
      toast.success(`${uploaded.length} fichier(s) ajouté(s)`)
    }
  }

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const next = [...images]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  // Type detection depuis l'URL
  const kindOf = (url) => {
    if (!url) return 'unknown'
    if (url.match(/\.(mp4|webm|mov)$/i) || url.includes('/api/file/') && url.match(/\.(mp4|webm|mov)/i)) return 'video'
    if (url.match(/\.pdf$/i) || (url.includes('/api/file/') && url.match(/\.pdf/i))) return 'pdf'
    return 'image'
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {(images || []).map((url, i) => {
          const kind = kindOf(url)
          return (
            <div key={url + i} className="relative aspect-square bg-cream border border-linen group overflow-hidden">
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : kind === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-ink/5 text-ink/70">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
                  </svg>
                  <span className="text-[9px] uppercase tracking-[0.22em] mt-1">Vidéo</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-ink/5 text-ink/70">
                  <FileText className="h-8 w-8" strokeWidth={1.5} />
                  <span className="text-[9px] uppercase tracking-[0.22em] mt-1">PDF</span>
                </div>
              )}
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 text-ivory">
                <div className="flex gap-1 text-[10px]">
                  <button type="button" onClick={() => move(i, -1)} className="bg-ivory/20 px-2 py-1 hover:bg-ivory/40 disabled:opacity-30" disabled={i === 0}>◀</button>
                  <button type="button" onClick={() => move(i, 1)} className="bg-ivory/20 px-2 py-1 hover:bg-ivory/40 disabled:opacity-30" disabled={i === (images.length - 1)}>▶</button>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="bg-ivory/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] hover:bg-ivory/40">Voir</a>
                <button type="button" onClick={() => remove(i)} className="bg-brique px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Retirer</button>
              </div>
              {i === 0 && kind === 'image' && <span className="absolute top-1 left-1 bg-emerald text-ivory text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5">Principal</span>}
            </div>
          )
        })}
        <label className="aspect-square bg-cream border border-dashed border-ink/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald hover:text-emerald transition text-ink/50 text-[10px] uppercase tracking-[0.22em] text-center px-2">
          <Upload className="h-5 w-5" strokeWidth={1.5} />
          {uploading ? 'Envoi…' : (accept === 'all' ? 'Télécharger' : 'Ajouter')}
          {accept === 'all' && !uploading && (
            <span className="text-[8px] normal-case tracking-normal text-ink/40">
              PNG · JPG · MP4 · PDF
            </span>
          )}
          <input
            type="file"
            multiple
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />
        </label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="aspect-square bg-cream border border-dashed border-ink/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald hover:text-emerald transition text-ink/50 text-[10px] uppercase tracking-[0.22em] text-center px-2"
        >
          <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
          Bibliothèque
          <span className="text-[8px] normal-case tracking-normal text-ink/40">
            Choisir un fichier existant
          </span>
        </button>
      </div>
      <details className="text-[11px] text-ink/50">
        <summary className="cursor-pointer hover:text-ink">Ou coller des URLs (une par ligne)</summary>
        <textarea
          rows={3}
          value={(images || []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
          className="w-full mt-2 bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm font-mono"
        />
      </details>

      <AnimatePresence>
        {pickerOpen && (
          <MediaPickerModal
            kindFilter={accept === 'all' ? 'all' : 'image'}
            onClose={() => setPickerOpen(false)}
            onPick={(url) => {
              onChange([...(images || []), url])
              setPickerOpen(false)
              toast.success('Ajouté depuis la bibliothèque')
            }}
            excludeUrls={images || []}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* =========================================================
   ONGLET — CONTENU DU SITE (hero + collections)
   ========================================================= */
const DEFAULT_CONTENT = {
  hero: {
    eyebrow: 'Nouvelle Collection · Automne-Hiver 2025',
    title: 'L\u2019art discret\nde la maison.',
    subtitle: 'Plaids crochet, macramé mural, poterie tournée main — chaque pièce imaginée, fabriquée et assemblée à la main dans notre atelier français.',
    ctaPrimary: { label: 'Découvrir la collection', href: '/collections?cat=nouveautes' },
    ctaSecondary: { label: 'Notre atelier', href: '/atelier' },
    image: '/api/img/jlt-hero-deco',
  },
  sectionTitle: 'Trois univers, une même main.',
  sectionEyebrow: 'Nos collections',
  collections: [
    { key: 'racine',    name: 'Racine',    tagline: 'Plaids · Coussins · Paniers · Chemins de table', image: '/api/img/jlt-plaid-beige' },
    { key: 'empreinte', name: 'Empreinte', tagline: 'Tapis · Macramé mural · Suspensions',            image: '/api/img/jlt-photophore-macrame' },
    { key: 'terre',     name: 'Terre',     tagline: 'Poterie tournée main · Céramique',               image: '/api/img/jlt-terra' },
  ],
  sections: HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } })),
  mediaLibrary: [],
}

function TabContent() {
  const [c, setC] = useState(null)
  const [saving, setSaving] = useState(false)

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
    if (r.ok) toast.success('Contenu enregistré')
    else toast.error('Erreur')
  }

  const upd = (path, value) => {
    setC((prev) => {
      const next = structuredClone(prev)
      const parts = path.split('.')
      let cur = next
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]]
      cur[parts[parts.length - 1]] = value
      return next
    })
  }

  const updColl = (idx, key, val) => {
    setC((prev) => {
      const next = structuredClone(prev)
      next.collections[idx][key] = val
      return next
    })
  }

  if (!c) return <div className="text-ink/50">Chargement…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="font-display text-3xl">Contenu du site</h2>
        <button onClick={save} disabled={saving} className="bg-emerald text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-emeraldDark transition flex items-center gap-2 disabled:opacity-60">
          <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      <div className="space-y-10 max-w-4xl">
        {/* BIBLIOTHÈQUE DE FICHIERS — téléchargement direct */}
        <MediaLibrary
          files={c.mediaLibrary || []}
          onChange={(files) => upd('mediaLibrary', files)}
        />

        {/* HERO */}
        <section className="border border-linen bg-ivory p-6 md:p-8">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-6">Section Hero (accueil)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Surtitre (petit texte)"><input value={c.hero.eyebrow} onChange={(e) => upd('hero.eyebrow', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Titre principal (utilise \n pour passer à la ligne)">
              <textarea rows={2} value={c.hero.title} onChange={(e) => upd('hero.title', e.target.value)} className="w-full bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink font-display text-lg" />
            </Field>
          </div>
          <Field label="Sous-titre">
            <textarea rows={3} value={c.hero.subtitle} onChange={(e) => upd('hero.subtitle', e.target.value)} className="w-full bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm" />
          </Field>
          <Field label="Photo du hero (glisser-déposer une image)">
            <ImageUploader
              images={c.hero.image ? [c.hero.image] : []}
              onChange={(imgs) => upd('hero.image', imgs[0] || '')}
            />
          </Field>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <Field label="Bouton principal — libellé"><input value={c.hero.ctaPrimary?.label || ''} onChange={(e) => upd('hero.ctaPrimary.label', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Bouton principal — lien"><input value={c.hero.ctaPrimary?.href || ''} onChange={(e) => upd('hero.ctaPrimary.href', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Bouton secondaire — libellé"><input value={c.hero.ctaSecondary?.label || ''} onChange={(e) => upd('hero.ctaSecondary.label', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Bouton secondaire — lien"><input value={c.hero.ctaSecondary?.href || ''} onChange={(e) => upd('hero.ctaSecondary.href', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
          </div>
        </section>

        {/* COLLECTIONS */}
        <section className="border border-linen bg-ivory p-6 md:p-8">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald mb-6">Section Collections</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Surtitre section"><input value={c.sectionEyebrow} onChange={(e) => upd('sectionEyebrow', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
            <Field label="Titre section"><input value={c.sectionTitle} onChange={(e) => upd('sectionTitle', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
          </div>
          <div className="mt-6 space-y-6">
            {c.collections.map((coll, i) => (
              <div key={coll.key} className="border border-linen p-4 bg-cream/30">
                <div className="grid md:grid-cols-3 gap-4 items-start">
                  <div className="md:col-span-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coll.image} alt={coll.name} className="w-full aspect-[4/5] object-cover bg-cream" />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <Field label={`Nom collection ${i + 1}`}><input value={coll.name} onChange={(e) => updColl(i, 'name', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-display text-lg" /></Field>
                    <Field label="Accroche (sous-titre)"><input value={coll.tagline} onChange={(e) => updColl(i, 'tagline', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink" /></Field>
                    <Field label="Photo de la collection (glisser-déposer)">
                      <ImageUploader
                        images={coll.image ? [coll.image] : []}
                        onChange={(imgs) => updColl(i, 'image', imgs[0] || '')}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTIONS PAGE D'ACCUEIL — activation, ordre et contenu */}
        <HomeSectionsEditor
          sections={c.sections}
          onChange={(next) => upd('sections', next)}
        />

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
   MediaPickerModal — sélecteur ouvert depuis les éditeurs
   pour insérer un fichier de la bibliothèque en 1 clic.
   ========================================================= */
function MediaPickerModal({ onClose, onPick, kindFilter = 'image', excludeUrls = [] }) {
  const [files, setFiles] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(kindFilter === 'all' ? 'all' : 'image')

  useEffect(() => {
    fetch('/api/admin/site-content', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFiles(d?.content?.mediaLibrary || []))
      .catch(() => setFiles([]))
  }, [])

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
  }

  // Filtrage : par type demandé + recherche + on retire ce qui est déjà utilisé
  const availableKinds = kindFilter === 'all' ? ['image', 'video', 'pdf'] : ['image']
  const excluded = new Set(excludeUrls)
  const filtered = (files || [])
    .filter((f) => availableKinds.includes(f.kind))
    .filter((f) => typeFilter === 'all' || f.kind === typeFilter)
    .filter((f) => !excluded.has(f.url))
    .filter((f) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (f.originalName || f.filename || '').toLowerCase().includes(q)
    })

  const typeCounts = (files || [])
    .filter((f) => availableKinds.includes(f.kind))
    .filter((f) => !excluded.has(f.url))
    .reduce((acc, f) => { acc[f.kind] = (acc[f.kind] || 0) + 1; return acc }, {})
  const totalAvailable = Object.values(typeCounts).reduce((a, b) => a + b, 0)

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 top-[6vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[6vh] md:w-[min(1080px,94vw)] max-h-[88vh] overflow-hidden flex flex-col bg-ivory z-50 shadow-2xl"
      >
        <div className="sticky top-0 bg-ivory/95 backdrop-blur border-b border-linen p-6 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> Bibliothèque de fichiers
            </span>
            <h3 className="font-display text-2xl mt-1">Choisir un fichier</h3>
            <p className="text-xs text-ink/60 mt-1">
              Cliquez sur un fichier pour l’insérer immédiatement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="hover:opacity-60 transition flex-shrink-0"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {/* Barre de recherche + filtres */}
          {(files || []).length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" strokeWidth={1.5} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  autoFocus
                  className="w-full bg-transparent border border-ink/15 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald"
                />
              </div>
              {kindFilter === 'all' && (
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'all',   label: `Tous · ${totalAvailable}` },
                    { key: 'image', label: `Images · ${typeCounts.image || 0}`, disabled: !typeCounts.image },
                    { key: 'video', label: `Vidéos · ${typeCounts.video || 0}`, disabled: !typeCounts.video },
                    { key: 'pdf',   label: `PDF · ${typeCounts.pdf || 0}`, disabled: !typeCounts.pdf },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTypeFilter(t.key)}
                      disabled={t.disabled}
                      className={cn(
                        'text-[10px] uppercase tracking-[0.22em] px-3 py-2 border transition',
                        typeFilter === t.key ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:border-ink text-ink/70',
                        t.disabled && 'opacity-40 cursor-not-allowed'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Grille sélectionnable */}
          {files === null ? (
            <p className="text-sm text-ink/50 italic text-center py-12">Chargement…</p>
          ) : (files || []).length === 0 ? (
            <div className="border border-dashed border-ink/20 p-10 text-center">
              <FolderOpen className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.5} />
              <p className="mt-3 text-ink/60">Aucun fichier dans la bibliothèque.</p>
              <p className="mt-1 text-[11px] text-ink/40">
                Téléchargez des fichiers depuis <strong>Contenu du site → Bibliothèque de fichiers</strong>.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink/50 italic text-center py-12">
              {excluded.size > 0 && excluded.size >= totalAvailable
                ? 'Tous les fichiers disponibles sont déjà utilisés ici.'
                : 'Aucun fichier ne correspond à votre recherche.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((f) => (
                <button
                  key={f.url}
                  type="button"
                  onClick={() => onPick(f.url)}
                  className="group text-left border border-linen bg-ivory hover:border-emerald hover:shadow-md transition overflow-hidden"
                >
                  <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                    {f.kind === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt="" className="w-full h-full object-cover img-zoom" />
                    ) : f.kind === 'video' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                        <Film className="h-10 w-10" strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-[0.22em] mt-2">Vidéo</span>
                      </div>
                    ) : f.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.thumbnail} alt="" className="w-full h-full object-contain bg-ivory" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                        <FileText className="h-10 w-10" strokeWidth={1.5} />
                        <span className="text-[10px] uppercase tracking-[0.22em] mt-2">PDF</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-ink/70 text-ivory text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 backdrop-blur">
                      {f.kind}
                    </span>
                    <div className="absolute inset-0 bg-emerald/0 group-hover:bg-emerald/20 flex items-center justify-center transition">
                      <div className="opacity-0 group-hover:opacity-100 bg-emerald text-ivory text-[10px] uppercase tracking-[0.24em] px-4 py-2 transition">
                        Insérer
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-ink/80 truncate" title={f.originalName}>
                      {f.originalName || f.filename}
                    </div>
                    <div className="text-[10px] text-ink/40 tabular-nums mt-0.5">
                      {formatSize(f.size)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}


function MediaLibrary({ files, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-desc') // date-desc | date-asc | size-desc | size-asc | name-asc | name-desc
  const [typeFilter, setTypeFilter] = useState('all') // all | image | video | pdf
  const dropRef = useState({ dragging: false })[0]

  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length) return
    setUploading(true)
    const uploaded = []
    for (const file of fileList) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json()
        if (r.ok && d.url) {
          const entry = {
            url: d.url,
            filename: d.filename,
            kind: d.kind,
            size: d.size,
            originalName: d.originalName || file.name,
            uploadedAt: new Date().toISOString(),
            compressed: d.compressed || false,
            originalSize: d.originalSize || d.size,
          }
          // Génère la miniature PDF côté client
          if (d.kind === 'pdf') {
            try {
              const { generatePdfThumbnail } = await import('@/lib/pdf-thumbnail')
              const thumb = await generatePdfThumbnail(file, 400)
              if (thumb) entry.thumbnail = thumb
            } catch (e) {
              console.warn('PDF thumb skip', e)
            }
          }
          uploaded.push(entry)
          if (d.compressed) {
            const saved = ((d.originalSize - d.size) / 1024 / 1024).toFixed(1)
            toast.success(`${file.name} compressé (−${saved} Mo)`)
          }
        } else {
          toast.error(d.error || 'Envoi échoué')
        }
      } catch (e) {
        toast.error('Envoi échoué')
      }
    }
    setUploading(false)
    if (uploaded.length) {
      onChange([...uploaded, ...(files || [])])
      toast.success(`${uploaded.length} fichier(s) téléchargé(s)`)
    }
  }

  const remove = (url) => {
    if (!confirm('Retirer ce fichier de la bibliothèque ? Le fichier reste sur le serveur.')) return
    onChange(files.filter((f) => f.url !== url))
  }

  const copy = async (url) => {
    try {
      const full = window.location.origin + url
      await navigator.clipboard.writeText(full)
      setCopiedUrl(url)
      toast.success('Lien copié')
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
  }

  const onDrop = async (e) => {
    e.preventDefault()
    dropRef.dragging = false
    e.currentTarget.classList.remove('ring-2', 'ring-emerald')
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length) await handleFiles(dropped)
  }

  // Filter + sort
  const filtered = (files || [])
    .filter((f) => typeFilter === 'all' || f.kind === typeFilter)
    .filter((f) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (f.originalName || f.filename || '').toLowerCase().includes(q)
    })
    .slice()
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':  return new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0)
        case 'size-desc': return (b.size || 0) - (a.size || 0)
        case 'size-asc':  return (a.size || 0) - (b.size || 0)
        case 'name-asc':  return (a.originalName || '').localeCompare(b.originalName || '', 'fr')
        case 'name-desc': return (b.originalName || '').localeCompare(a.originalName || '', 'fr')
        case 'date-desc':
        default:          return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
      }
    })

  const totalCount = (files || []).length
  const typeCounts = (files || []).reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] || 0) + 1
    return acc
  }, {})

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> Bibliothèque de fichiers
            {totalCount > 0 && (
              <span className="text-ink/40 normal-case tracking-normal">
                · {totalCount} fichier{totalCount > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <p className="text-xs text-ink/60 mt-2 max-w-2xl">
            Téléchargez photos, vidéos et documents pour les réutiliser partout.
            Les images de plus de 2 Mo sont compressées automatiquement.
          </p>
        </div>
        <label
          className={cn(
            'inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] px-5 py-3 bg-emerald text-ivory hover:bg-emeraldDark transition cursor-pointer',
            uploading && 'opacity-60 cursor-wait'
          )}
        >
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          {uploading ? 'Envoi en cours…' : 'Télécharger un fichier'}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('ring-2', 'ring-emerald')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('ring-2', 'ring-emerald')
        }}
        onDrop={onDrop}
        className="border-2 border-dashed border-ink/15 bg-cream/30 rounded-sm p-8 text-center transition mb-6"
      >
        <Upload className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-ink/60">
          Glissez-déposez vos fichiers ici, ou cliquez sur <strong>Télécharger un fichier</strong> ci-dessus
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-ink/40">
          PNG · JPG · WEBP · MP4 · WEBM · PDF · max 50 Mo · compression auto {'>'}2 Mo
        </p>
      </div>

      {/* Barre de recherche + filtres + tri */}
      {totalCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" strokeWidth={1.5} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom…"
              className="w-full bg-transparent border border-ink/15 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { key: 'all',   label: `Tous · ${totalCount}` },
              { key: 'image', label: `Images · ${typeCounts.image || 0}`, disabled: !typeCounts.image },
              { key: 'video', label: `Vidéos · ${typeCounts.video || 0}`, disabled: !typeCounts.video },
              { key: 'pdf',   label: `PDF · ${typeCounts.pdf || 0}`, disabled: !typeCounts.pdf },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTypeFilter(t.key)}
                disabled={t.disabled}
                className={cn(
                  'text-[10px] uppercase tracking-[0.22em] px-3 py-2 border transition',
                  typeFilter === t.key ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:border-ink text-ink/70',
                  t.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-ink/60">
            <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-ink/15 px-2 py-1.5 text-[11px] uppercase tracking-[0.22em] focus:outline-none focus:border-emerald cursor-pointer"
            >
              <option value="date-desc">Récents d'abord</option>
              <option value="date-asc">Anciens d'abord</option>
              <option value="size-desc">Plus lourds</option>
              <option value="size-asc">Plus légers</option>
              <option value="name-asc">Nom A→Z</option>
              <option value="name-desc">Nom Z→A</option>
            </select>
          </div>
        </div>
      )}

      {/* Grille de fichiers */}
      {totalCount === 0 ? (
        <p className="text-sm text-ink/50 italic text-center py-6">
          Aucun fichier téléchargé pour l’instant.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink/50 italic text-center py-6">
          Aucun fichier ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((f) => (
            <div key={f.url} className="border border-linen bg-ivory group overflow-hidden">
              <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                {f.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                ) : f.kind === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                    <Film className="h-10 w-10" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.22em] mt-2">Vidéo</span>
                  </div>
                ) : f.thumbnail ? (
                  // Aperçu PDF (première page)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.thumbnail} alt="" className="w-full h-full object-contain bg-ivory" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                    <FileText className="h-10 w-10" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.22em] mt-2">PDF</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-ink/70 text-ivory text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 backdrop-blur">
                  {f.kind}
                </span>
                {f.compressed && (
                  <span
                    className="absolute top-2 right-2 bg-emerald text-ivory text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 backdrop-blur"
                    title={`Compressé de ${formatSize(f.originalSize)} à ${formatSize(f.size)}`}
                  >
                    ↓ Optimisé
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="text-xs text-ink/80 truncate" title={f.originalName}>
                  {f.originalName || f.filename}
                </div>
                <div className="text-[10px] text-ink/40 tabular-nums">{formatSize(f.size)}</div>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => copy(f.url)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] px-2 py-1.5 border border-ink/20 hover:border-emerald hover:text-emerald transition"
                  >
                    {copiedUrl === f.url ? (
                      <><Check className="h-3 w-3 text-emerald" strokeWidth={1.5} /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" strokeWidth={1.5} /> Lien</>
                    )}
                  </button>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-2 py-1.5 border border-ink/20 hover:border-emerald hover:text-emerald transition"
                    aria-label="Ouvrir"
                  >
                    <Eye className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(f.url)}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-terracotta hover:opacity-70"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink/45">
        💡 Astuce : cliquez sur <strong>Lien</strong> pour copier l’URL et la coller dans un article ou une bannière.
      </p>
    </section>
  )
}


function HomeSectionsEditor({ sections, onChange }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!Array.isArray(sections)) return null

  const toggleEnabled = (i) => {
    const next = sections.slice()
    next[i] = { ...next[i], enabled: !next[i].enabled }
    onChange(next)
  }
  const updContent = (i, key, value) => {
    const next = sections.slice()
    next[i] = { ...next[i], content: { ...(next[i].content || {}), [key]: value } }
    onChange(next)
  }
  const updLabel = (i, value) => {
    const next = sections.slice()
    next[i] = { ...next[i], label: value }
    onChange(next)
  }
  const removeSection = (i) => {
    if (!confirm('Supprimer cette bannière personnalisée ?')) return
    const next = sections.slice()
    next.splice(i, 1)
    onChange(next)
  }
  const addFromTemplate = (template) => {
    const id = 'custom-' + Math.random().toString(36).slice(2, 8)
    const newSection = {
      id,
      type: 'editorial-banner',
      label: template.name === 'Vierge' ? 'Nouvelle bannière' : template.name,
      enabled: true,
      custom: true,
      content: { ...template.preset },
    }
    onChange([...sections, newSection])
    setExpandedId(id)
    setPickerOpen(false)
  }
  const resetAll = () => {
    if (!confirm('Réinitialiser toutes les sections à leur configuration par défaut ? Les bannières personnalisées seront supprimées.')) return
    onChange(HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } })))
  }

  // Drag & drop
  const onDragStart = (i) => (e) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    // Firefox requires setData
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
  }
  const onDragOver = (i) => (e) => {
    e.preventDefault()
    if (i !== overIdx) setOverIdx(i)
  }
  const onDrop = (i) => (e) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) {
      setDragIdx(null); setOverIdx(null); return
    }
    const next = sections.slice()
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDragIdx(null); setOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.5} /> Sections page d’accueil
          </h3>
          <p className="text-xs text-ink/60 mt-2 max-w-2xl">
            Glissez-déposez pour réordonner. Cliquez sur une section pour modifier son contenu.
            Le Hero reste toujours visible (édité plus haut).
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] px-3 py-2 bg-emerald text-ivory hover:bg-emeraldDark transition"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Ajouter une bannière
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="text-[10px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 hover:border-terracotta hover:text-terracotta transition whitespace-nowrap"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <ol className="space-y-3" onDragEnd={onDragEnd}>
        {sections.map((s, i) => {
          const isExpanded = expandedId === s.id
          const isDragging = dragIdx === i
          const isOver = overIdx === i && dragIdx !== i
          return (
            <li
              key={s.id}
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              className={cn(
                'border transition relative',
                s.enabled ? 'border-linen bg-ivory' : 'border-dashed border-ink/15 bg-cream/30',
                isDragging && 'opacity-40',
                isOver && 'ring-2 ring-emerald ring-offset-2 ring-offset-ivory'
              )}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Drag handle */}
                <div
                  className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-ink/30 hover:text-ink"
                  title="Glisser pour réordonner"
                >
                  <GripVertical className="h-4 w-4" strokeWidth={1.5} />
                </div>

                {/* Order number */}
                <span className="w-6 text-center text-[11px] tabular-nums text-ink/40">
                  {i + 1}
                </span>

                {/* Section label + type — cliquable pour développer */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex-1 min-w-0 text-left group"
                >
                  <div className="font-display text-base leading-tight truncate group-hover:text-emerald transition">
                    {s.label}
                    {s.custom && (
                      <span className="ml-2 text-[9px] uppercase tracking-[0.24em] bg-terracotta/15 text-terracotta px-2 py-0.5 align-middle">
                        Perso
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-ink/45 mt-0.5">
                    {s.type} {s.type === 'editorial-banner' || s.type === 'product-carousel' ? '· clic pour modifier' : ''}
                  </div>
                </button>

                {/* Live preview thumbnail */}
                <div className="hidden md:block flex-shrink-0">
                  <SectionPreview section={s} compact />
                </div>

                {/* Enable toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={!!s.enabled}
                    onChange={() => toggleEnabled(i)}
                    className="h-4 w-4"
                  />
                  <span className={`text-[11px] uppercase tracking-[0.22em] hidden sm:inline ${s.enabled ? 'text-emerald' : 'text-ink/40'}`}>
                    {s.enabled ? (
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Visible</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> Masqué</span>
                    )}
                  </span>
                </label>

                {/* Delete (custom only) */}
                {s.custom && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="p-1 text-terracotta hover:opacity-70 flex-shrink-0"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Aperçu large + éditeur */}
              {isExpanded && (
                <div className="border-t border-linen/60 bg-cream/20 p-5">
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6">
                    {/* Preview grand */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Aperçu</div>
                      <SectionPreview section={s} />
                    </div>
                    {/* Editor */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Contenu</div>
                      {s.custom && (
                        <Field label="Nom (visible seulement en admin)">
                          <input
                            value={s.label || ''}
                            onChange={(e) => updLabel(i, e.target.value)}
                            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
                          />
                        </Field>
                      )}
                      <SectionContentEditor
                        type={s.type}
                        content={s.content || {}}
                        onChange={(key, value) => updContent(i, key, value)}
                      />
                      {s.type !== 'editorial-banner' && s.type !== 'product-carousel' && (
                        <p className="text-[11px] text-ink/50 italic">
                          Cette section n’a pas de contenu modifiable. Utilisez le toggle pour l’afficher ou la masquer.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-ink/45">
        Cliquez sur <strong>Enregistrer</strong> en haut pour appliquer les changements.
      </p>

      {/* Modale — bibliothèque de modèles de bannières */}
      <AnimatePresence>
        {pickerOpen && (
          <TemplatePicker
            onClose={() => setPickerOpen(false)}
            onPick={addFromTemplate}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* Modale — choix d'un modèle de bannière */
function TemplatePicker({ onClose, onPick }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 top-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[10vh] md:w-[min(920px,92vw)] max-h-[84vh] overflow-auto bg-ivory z-50 shadow-2xl"
      >
        <div className="sticky top-0 bg-ivory/95 backdrop-blur border-b border-linen flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.32em] text-emerald">
              Bibliothèque de modèles
            </span>
            <h3 className="font-display text-2xl mt-1">Choisissez un modèle</h3>
            <p className="text-xs text-ink/60 mt-1">Vous pourrez tout modifier ensuite.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="hover:opacity-60 transition"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BANNER_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onPick(t)}
              className="group text-left border border-linen bg-ivory hover:border-emerald hover:shadow-lg transition overflow-hidden"
            >
              {/* Preview */}
              <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                {t.preset.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.preset.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover img-zoom"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.24em] text-ink/40">
                    Sans image
                  </div>
                )}
                <div className="absolute inset-0 bg-ink/30" />
                <div className={`absolute inset-0 flex flex-col justify-end p-4 ${t.preset.align === 'right' ? 'items-end text-right' : 'items-start'}`}>
                  <div className="text-[9px] uppercase tracking-[0.28em] text-ivory/90">
                    {t.preset.eyebrow}
                  </div>
                  <div className="font-display text-ivory text-lg leading-tight mt-1 line-clamp-2 max-w-full">
                    {t.preset.title}
                  </div>
                  {t.preset.ctaLabel && (
                    <div className="mt-2 inline-block text-[9px] uppercase tracking-[0.24em] text-ivory border border-ivory/70 px-3 py-1">
                      {t.preset.ctaLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        t.accent === 'terracotta' ? '#B85B45' :
                        t.accent === 'emerald' ? '#0F5C3F' :
                        t.accent === 'sable' ? '#D4C7A9' :
                        t.accent === 'brique' ? '#8B4A3E' :
                        '#211E1A',
                    }}
                  />
                  <div className="font-display text-lg group-hover:text-emerald transition">
                    {t.name}
                  </div>
                </div>
                <p className="text-[12px] text-ink/60 mt-1">{t.tagline}</p>
                <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-emerald opacity-0 group-hover:opacity-100 transition">
                  Utiliser ce modèle →
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

/* Aperçu miniature d'une section */
function SectionPreview({ section, compact = false }) {
  const s = section
  const c = s.content || {}
  const size = compact
    ? 'w-32 h-14'
    : 'w-full aspect-[16/9] max-w-md'

  const badge = (label) => (
    <div className={`${size} bg-linen/50 border border-linen flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/50 text-center px-2`}>
      {label}
    </div>
  )

  if (s.type === 'editorial-banner') {
    return (
      <div className={`${size} relative overflow-hidden bg-cream border border-linen`}>
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/40">
            Image
          </div>
        )}
        <div className="absolute inset-0 bg-ink/30" />
        <div className={`absolute inset-0 flex flex-col justify-end p-2 ${c.align === 'right' ? 'items-end text-right' : 'items-start'}`}>
          {c.eyebrow && (
            <div className={`text-[7px] uppercase tracking-[0.22em] text-ivory/90 ${compact ? '' : 'text-[10px]'}`}>
              {c.eyebrow}
            </div>
          )}
          <div className={`font-display text-ivory leading-tight ${compact ? 'text-[10px]' : 'text-lg'} truncate max-w-full`}>
            {c.title || 'Titre'}
          </div>
          {!compact && c.ctaLabel && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ivory border-b border-ivory/60 pb-0.5">
              {c.ctaLabel} →
            </div>
          )}
        </div>
      </div>
    )
  }

  if (s.type === 'product-carousel') {
    return (
      <div className={`${compact ? 'w-32 h-14' : 'w-full max-w-md'} border border-linen bg-cream/40 p-2`}>
        {!compact && (
          <div className="text-[9px] uppercase tracking-[0.22em] text-terracotta">
            {c.eyebrow || 'Carrousel'}
          </div>
        )}
        <div className={`font-display leading-tight ${compact ? 'text-[10px] text-center' : 'text-sm mt-1'} truncate`}>
          {c.title || 'Carrousel produits'}
        </div>
        {!compact && (
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex-1 aspect-[3/4] bg-linen/60" />
            ))}
          </div>
        )}
        {compact && (
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 3 }).map((_, k) => (
              <div key={k} className="flex-1 h-3 bg-linen/60" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (s.type === 'category-tiles') return badge('3 collections · grille')
  if (s.type === 'collections-themes') return badge('3 univers · détail')
  if (s.type === 'newsletter') return badge('Newsletter')

  return badge(s.type)
}


function SectionContentEditor({ type, content, onChange }) {
  if (type === 'editorial-banner') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Surtitre (petit texte)">
          <input
            value={content.eyebrow || ''}
            onChange={(e) => onChange('eyebrow', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Titre principal">
          <input
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-display text-lg"
          />
        </Field>
        <Field label="Bouton — libellé">
          <input
            value={content.ctaLabel || ''}
            onChange={(e) => onChange('ctaLabel', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Bouton — lien">
          <input
            value={content.ctaHref || ''}
            onChange={(e) => onChange('ctaHref', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm font-mono"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Image (URL)">
            <ImageUploader
              images={content.image ? [content.image] : []}
              onChange={(imgs) => onChange('image', imgs[0] || '')}
            />
          </Field>
        </div>
        <Field label="Alignement">
          <select
            value={content.align || 'left'}
            onChange={(e) => onChange('align', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="left">Gauche</option>
            <option value="right">Droite</option>
          </select>
        </Field>
        <Field label="Hauteur">
          <select
            value={content.height || 'md'}
            onChange={(e) => onChange('height', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="sm">Petite</option>
            <option value="md">Moyenne</option>
            <option value="lg">Grande</option>
          </select>
        </Field>
      </div>
    )
  }

  if (type === 'product-carousel') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Surtitre">
          <input
            value={content.eyebrow || ''}
            onChange={(e) => onChange('eyebrow', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Titre">
          <input
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-display text-lg"
          />
        </Field>
        <Field label="Filtre">
          <select
            value={content.filter || 'new'}
            onChange={(e) => onChange('filter', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="new">Nouveautés</option>
            <option value="bestsellers">Meilleures ventes</option>
            <option value="limited">Éditions limitées</option>
            <option value="all">Tous les produits</option>
          </select>
        </Field>
        <Field label="Lien &laquo; voir tout &raquo;">
          <input
            value={content.viewAllHref || ''}
            onChange={(e) => onChange('viewAllHref', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm font-mono"
          />
        </Field>
        <Field label="Nombre de produits">
          <input
            type="number"
            min={2}
            max={20}
            value={content.limit || 8}
            onChange={(e) => onChange('limit', Number(e.target.value))}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
      </div>
    )
  }

  return null
}



/* =========================================================
   ONGLET — PARAMÈTRES (email, téléphone, réseaux)
   ========================================================= */
const DEFAULT_SETTINGS = {
  brand: {
    name: 'Atelier JLT',
    tagline: 'Maison française de décoration artisanale',
    email: 'contact@atelierjlt.fr',
    phone: '',
    address: 'Drôme, France',
  },
  social: {
    instagram: 'https://www.instagram.com/atelier.jlt/',
    facebook: 'https://www.facebook.com/atelier.jlt/',
    pinterest: '',
  },
  marquee: {
    line1: 'Livraison offerte dès 150 €',
    line2: 'Fabrication française',
    line3: 'Emballage soigné',
  },
}

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
