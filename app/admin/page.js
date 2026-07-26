'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { LayoutDashboard, Package, ShoppingBag, Tag, Users, Mail, LogOut, Plus, Trash2, Save, Ticket } from 'lucide-react'

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
          <p className="text-ink/60 mt-3 text-sm">Accès réservé à l'équipe Ginette.</p>
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
    { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { key: 'products', label: 'Produits', icon: Package },
    { key: 'orders', label: 'Commandes', icon: ShoppingBag },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
    { key: 'newsletter', label: 'Newsletter', icon: Mail },
    { key: 'users', label: 'Clients', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-linen sticky top-0 bg-ivory/95 backdrop-blur z-30">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="font-display text-xl font-black">Atelier Ginette — Admin</div>
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
            {tab === 'products' && <TabProducts />}
            {tab === 'orders' && <TabOrders />}
            {tab === 'coupons' && <TabCoupons />}
            {tab === 'newsletter' && <TabNewsletter />}
            {tab === 'users' && <TabUsers />}
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
        <Field label="Catégorie">
          <select value={p.category || ''} onChange={(e) => upd('category', e.target.value)} className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink">
            {['sacs', 'bougies', 'bijoux', 'decoration'].map((c) => <option key={c} value={c}>{c}</option>)}
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
      <Field label="URLs images (une par ligne)">
        <textarea rows={3} value={(p.images || []).join('\n')} onChange={(e) => upd('images', e.target.value.split('\n').filter(Boolean))} className="w-full mt-1 bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm font-mono" />
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
