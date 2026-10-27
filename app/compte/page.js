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
import { User, MapPin, Package, Heart, LogOut, Sparkles, ChevronDown, Check, Truck, ExternalLink } from 'lucide-react'
import { ORDER_STEPS, getTrackingUrl, carrierLabel } from '@/lib/tracking'

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

  const [sentMsg, setSentMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    if (mode === 'forgot') {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      }).catch(() => null)
      const d = await res?.json().catch(() => ({}))
      setSentMsg(d?.message || 'Si un compte existe avec cette adresse, un email vient de vous être envoyé.')
      setBusy(false)
      return
    }
    const r = mode === 'login' ? await onLogin(email, password) : await onRegister(email, password, name)
    if (!r.ok) toast.error(r.error || 'Erreur')
    else toast.success('Bienvenue chez Atelier JLT')
    setBusy(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-md mx-auto">
      <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Mon compte</span>
      <h1 className="font-display font-bold text-4xl md:text-5xl mt-3 leading-tight">
        {mode === 'login' ? 'Bonjour à nouveau.' : mode === 'forgot' ? 'Mot de passe oublié.' : 'Bienvenue dans la maison.'}
      </h1>
      <p className="text-ink/60 mt-3">
        {mode === 'login'
          ? 'Retrouvez vos commandes, votre wishlist et vos adresses.'
          : mode === 'forgot'
            ? 'Indiquez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.'
            : 'Créez votre compte en 30 secondes.'}
      </p>
      {mode === 'forgot' && sentMsg && (
        <p data-testid="forgot-sent" className="mt-8 border border-emerald/30 bg-emerald/5 text-emerald px-4 py-3 text-sm">{sentMsg}</p>
      )}
      <form onSubmit={submit} className="space-y-5 mt-10">
        {mode === 'register' && (
          <Field label="Votre prénom">
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
          </Field>
        )}
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
        </Field>
        {mode !== 'forgot' && (
          <Field label="Mot de passe">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
          </Field>
        )}
        {mode === 'login' && (
          <div className="text-right -mt-2">
            <button type="button" data-testid="forgot-link" onClick={() => { setMode('forgot'); setSentMsg('') }} className="text-xs text-ink/60 underline underline-offset-4 hover:text-terracotta">
              Mot de passe oublié ?
            </button>
          </div>
        )}
        <button disabled={busy} className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors disabled:opacity-70">
          {busy ? '…' : mode === 'login' ? 'Se connecter' : mode === 'forgot' ? 'Recevoir le lien' : 'Créer mon compte'}
        </button>
      </form>
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-6 text-[11px] uppercase tracking-[0.24em] text-ink/60 hover:text-terracotta transition w-full text-center">
        {mode === 'login' ? 'Nouveau chez Atelier JLT — créer un compte' : mode === 'forgot' ? 'Retour à la connexion' : "Déjà un compte — me connecter"}
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
            {user.loyaltyPoints || 0} points JLT · <span className="italic">100 points = -10€ sur votre prochaine commande</span>
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
        <MetaBox label="Points JLT" value={`${user.loyaltyPoints || 0} pts`} />
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
    <div className="space-y-4" data-testid="account-orders">
      <h2 className="font-display text-3xl mb-6">Mes commandes</h2>
      {orders.map((o) => <AccountOrder key={o._id} order={o} />)}
    </div>
  )
}

function AccountOrder({ order: o }) {
  const [open, setOpen] = useState(false)
  const cancelled = o.status === 'cancelled'
  const stepIdx = Math.max(0, ORDER_STEPS.findIndex(([v]) => v === (o.status || 'received')))
  const url = getTrackingUrl(o)
  const statusLabel = cancelled ? 'Annulée' : ORDER_STEPS[stepIdx]?.[1]
  const count = (o.items || []).reduce((n, i) => n + (i.qty || 1), 0)
  const dateOf = { received: o.createdAt, shipped: o.shippedAt, delivered: o.deliveredAt }
  return (
    <div className="border border-linen bg-ivory" data-testid={`account-order-${o.orderNumber}`}>
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-left">
        <div>
          <div className="font-display text-lg">{o.orderNumber}</div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-ink/50">{new Date(o.createdAt).toLocaleDateString('fr-FR')} · {count} article{count > 1 ? 's' : ''}</div>
        </div>
        <div className="flex items-center gap-4">
          <span className={`text-[11px] uppercase tracking-[0.22em] px-3 py-1 ${cancelled ? 'bg-terracotta/10 text-terracotta' : o.status === 'shipped' || o.status === 'delivered' ? 'bg-emerald/10 text-emerald' : 'bg-cream'}`}>{statusLabel}</span>
          <span className="font-display text-xl tabular-nums">{formatPrice(o.total)}</span>
          <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
        </div>
      </button>

      {!cancelled && (
        <div className="px-5 pb-5">
          <ol className="grid grid-cols-4 gap-1" aria-label="Étapes de la commande">
            {ORDER_STEPS.map(([v, label], i) => {
              const done = i <= stepIdx
              return (
                <li key={v} className="flex flex-col items-center text-center">
                  <div className="flex items-center w-full">
                    <span className={`flex-1 h-[2px] ${i === 0 ? 'opacity-0' : done ? 'bg-emerald' : 'bg-linen'}`} />
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center border-2 flex-none ${done ? 'bg-emerald border-emerald text-ivory' : 'border-linen text-ink/30 bg-ivory'}`}>
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : <span className="text-[10px]">{i + 1}</span>}
                    </span>
                    <span className={`flex-1 h-[2px] ${i === ORDER_STEPS.length - 1 ? 'opacity-0' : i < stepIdx ? 'bg-emerald' : 'bg-linen'}`} />
                  </div>
                  <span className={`mt-2 text-[10px] md:text-[11px] uppercase tracking-[0.16em] ${done ? 'text-ink' : 'text-ink/40'}`}>{label}</span>
                  {dateOf[v] && done && <span className="text-[10px] text-ink/45">{new Date(dateOf[v]).toLocaleDateString('fr-FR')}</span>}
                </li>
              )
            })}
          </ol>
          {o.trackingNumber && (
            <div className="mt-5 flex flex-wrap items-center gap-3 bg-cream/40 border border-linen p-4">
              <Truck className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              <span className="text-sm">{carrierLabel(o.carrier)} · n° <strong className="tabular-nums">{o.trackingNumber}</strong></span>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" data-testid="tracking-link" className="ml-auto h-10 px-4 inline-flex items-center gap-2 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] hover:bg-emeraldDark">
                  Suivre mon colis <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {open && (
        <div className="border-t border-linen p-5 grid md:grid-cols-[1fr_260px] gap-6">
          <ul className="space-y-3">
            {(o.items || []).map((it, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="h-14 w-14 bg-cream overflow-hidden flex-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {it.image && <img src={it.image} alt={it.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{it.name}</div>
                  <div className="text-[11px] text-ink/50">{[it.variant, it.size].filter(Boolean).join(' · ')}{(it.variant || it.size) ? ' · ' : ''}× {it.qty}</div>
                </div>
                <div className="text-sm tabular-nums">{formatPrice((it.price || 0) * (it.qty || 1))}</div>
              </li>
            ))}
          </ul>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-ink/60">Sous-total</dt><dd className="tabular-nums">{formatPrice(o.subtotal || 0)}</dd></div>
            {o.discount > 0 && <div className="flex justify-between"><dt className="text-ink/60">Réduction</dt><dd className="tabular-nums">−{formatPrice(o.discount)}</dd></div>}
            {o.giftCredit > 0 && <div className="flex justify-between"><dt className="text-ink/60">Carte cadeau</dt><dd className="tabular-nums">−{formatPrice(o.giftCredit)}</dd></div>}
            <div className="flex justify-between"><dt className="text-ink/60">Livraison</dt><dd className="tabular-nums">{o.shipping ? formatPrice(o.shipping) : 'Offerte'}</dd></div>
            <div className="flex justify-between border-t border-linen pt-2 font-medium"><dt>Total</dt><dd className="tabular-nums">{formatPrice(o.total)}</dd></div>
          </dl>
        </div>
      )}
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
