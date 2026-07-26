'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { useAuth } from '@/components/site/auth-provider'
import { formatPrice } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { User, MapPin, Package, Heart, LogOut, Sparkles } from 'lucide-react'

export default function ComptePage() {
  const { user, loading, login, register, logout } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [tab, setTab] = useState('profil')

  if (loading) return <div className="min-h-screen bg-ivory" />

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container py-16 md:py-24 max-w-6xl">
        {!user ? (
          <AuthCard mode={mode} setMode={setMode} onLogin={login} onRegister={register} />
        ) : (
          <Dashboard user={user} tab={tab} setTab={setTab} onLogout={logout} />
        )}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}

function AuthCard({ mode, setMode, onLogin, onRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const r = mode === 'login' ? await onLogin(email, password) : await onRegister(email, password, name)
    if (!r.ok) toast.error(r.error || 'Erreur')
    else toast.success('Bienvenue chez Ginette')
    setBusy(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-md mx-auto">
      <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Mon compte</span>
      <h1 className="font-display font-bold text-4xl md:text-5xl mt-3 leading-tight">
        {mode === 'login' ? 'Bonjour à nouveau.' : 'Bienvenue dans la maison.'}
      </h1>
      <p className="text-ink/60 mt-3">
        {mode === 'login'
          ? 'Retrouvez vos commandes, votre wishlist et vos adresses.'
          : 'Créez votre compte en 30 secondes.'}
      </p>
      <form onSubmit={submit} className="space-y-5 mt-10">
        {mode === 'register' && (
          <Field label="Votre prénom">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
          </Field>
        )}
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
        </Field>
        <Field label="Mot de passe">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
        </Field>
        <button disabled={busy} className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors disabled:opacity-70">
          {busy ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-6 text-[11px] uppercase tracking-[0.24em] text-ink/60 hover:text-terracotta transition w-full text-center">
        {mode === 'login' ? 'Nouvelle chez Ginette — créer un compte' : "Déjà un compte — me connecter"}
      </button>
    </motion.div>
  )
}

function Dashboard({ user, tab, setTab, onLogout }) {
  const tabs = [
    { key: 'profil', label: 'Profil', icon: User },
    { key: 'commandes', label: 'Commandes', icon: Package },
    { key: 'adresses', label: 'Adresses', icon: MapPin },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
  ]

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 md:mb-16">
        <div>
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Bienvenue</span>
          <h1 className="font-display font-bold text-4xl md:text-6xl mt-3 leading-tight">Bonjour {user.name || user.email.split('@')[0]}.</h1>
          <p className="text-ink/60 mt-3">
            <Sparkles className="h-4 w-4 inline mr-1 text-terracotta" strokeWidth={1.5} />
            {user.loyaltyPoints || 0} points Ginette · <span className="italic">100 points = -10€ sur votre prochaine commande</span>
          </p>
        </div>
        <button onClick={onLogout} className="self-start flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-ink/60 hover:text-terracotta transition">
          <LogOut className="h-4 w-4" strokeWidth={1.5} /> Se déconnecter
        </button>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-10 md:gap-16">
        <nav className="space-y-1 md:border-r md:border-linen md:pr-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition ${tab === t.key ? 'bg-linen/40 text-ink' : 'text-ink/60 hover:text-ink'}`}>
              <t.icon className="h-4 w-4" strokeWidth={1.5} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              {tab === 'profil' && <TabProfile user={user} />}
              {tab === 'commandes' && <TabOrders />}
              {tab === 'adresses' && <TabAddresses user={user} />}
              {tab === 'wishlist' && <TabWishlist />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.28em] text-ink/60">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function TabProfile({ user }) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl">Vos informations</h2>
      <div className="grid md:grid-cols-2 gap-6 text-sm">
        <MetaBox label="Prénom" value={user.name || '—'} />
        <MetaBox label="Email" value={user.email} />
        <MetaBox label="Compte créé le" value={new Date(user.createdAt).toLocaleDateString('fr-FR')} />
        <MetaBox label="Points Ginette" value={`${user.loyaltyPoints || 0} pts`} />
      </div>
    </div>
  )
}

function MetaBox({ label, value }) {
  return (
    <div className="border border-linen p-4">
      <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50">{label}</div>
      <div className="font-display text-lg mt-1">{value}</div>
    </div>
  )
}

function TabOrders() {
  const [orders, setOrders] = useState(null)
  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' }).then((r) => r.json()).then((d) => setOrders(d.orders || []))
  }, [])
  if (orders === null) return <div className="text-ink/50">Chargement…</div>
  if (orders.length === 0) return (
    <div className="text-center py-16">
      <Package className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.2} />
      <p className="font-display text-2xl mt-4">Pas encore de commande</p>
      <p className="text-ink/60 mt-2">Vos futures pièces vous y attendront.</p>
      <Link href="/collections" className="inline-block mt-6 bg-ink text-ivory px-8 py-3 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition">Découvrir la collection</Link>
    </div>
  )
  return (
    <div className="space-y-4">
      <h2 className="font-display text-3xl mb-6">Historique de commandes</h2>
      {orders.map((o) => (
        <div key={o._id} className="border border-linen p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="font-display text-lg">{o.orderNumber}</div>
            <div className="text-[11px] uppercase tracking-[0.24em] text-ink/50">{new Date(o.createdAt).toLocaleDateString('fr-FR')} · {o.items?.length || 0} article{(o.items?.length || 0) > 1 ? 's' : ''}</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-[11px] uppercase tracking-[0.22em] px-3 py-1 bg-cream">{o.status}</div>
            <div className="font-display text-xl tabular-nums">{formatPrice(o.total)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TabAddresses({ user }) {
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Vos adresses</h2>
      <p className="text-ink/60">Les adresses saisies lors de vos commandes s’ajouteront automatiquement ici. Vous pourrez les modifier au prochain paiement.</p>
    </div>
  )
}

function TabWishlist() {
  const [items, setItems] = useState(null)
  useEffect(() => {
    fetch('/api/wishlist', { credentials: 'include' }).then((r) => r.json()).then((d) => setItems(d.items || []))
  }, [])
  const remove = async (slug) => {
    await fetch('/api/wishlist?slug=' + slug, { method: 'DELETE', credentials: 'include' })
    setItems((v) => v.filter((p) => p.slug !== slug))
  }
  if (items === null) return <div className="text-ink/50">Chargement…</div>
  if (items.length === 0) return (
    <div className="text-center py-16">
      <Heart className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.2} />
      <p className="font-display text-2xl mt-4">Wishlist vide</p>
      <p className="text-ink/60 mt-2">Cliquez sur ♥ sur une fiche produit pour l’y ajouter.</p>
    </div>
  )
  return (
    <div>
      <h2 className="font-display text-3xl mb-6">Vos favoris</h2>
      <div className="grid sm:grid-cols-2 gap-6">
        {items.map((p) => (
          <div key={p.slug} className="flex gap-4 border border-linen p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.images?.[0]} alt={p.name} className="w-24 h-28 object-cover bg-cream" />
            <div className="flex-1">
              <Link href={`/produit/${p.slug}`} className="font-display text-lg leading-tight hover:text-terracotta">{p.name}</Link>
              <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50 mt-1">{p.material}</div>
              <div className="font-display mt-3">{formatPrice(p.price)}</div>
              <button onClick={() => remove(p.slug)} className="mt-2 text-[11px] uppercase tracking-[0.22em] text-ink/50 hover:text-terracotta">Retirer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
