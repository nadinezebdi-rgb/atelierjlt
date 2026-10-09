'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Lock, ShieldCheck, Tag, Gift, Check, ArrowLeft, ChevronRight, Truck, Zap, CreditCard, Apple, Wallet } from 'lucide-react'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import { useCart } from '@/components/site/cart-provider'
import { useAuth } from '@/components/site/auth-provider'
import { formatPrice } from '@/lib/utils'

export default function CheckoutPage() {
  const { items, subtotal, refresh } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [addr, setAddr] = useState({
    firstName: '', lastName: '', address: '', apt: '', city: '', zip: '',
    country: 'France', phone: '',
  })
  const [shippingMethod, setShippingMethod] = useState('standard') // standard | express
  const [paymentMethod, setPaymentMethod] = useState('card') // card | apple | paypal
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [giftCode, setGiftCode] = useState('')
  const [gift, setGift] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [placed, setPlaced] = useState(null)

  // Prefill user info
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      if (user.name) {
        const [first, ...rest] = user.name.split(' ')
        setAddr((a) => ({ ...a, firstName: a.firstName || first || '', lastName: a.lastName || rest.join(' ') }))
      }
    }
  }, [user])

  const applyCoupon = async () => {
    if (!couponCode) return
    const r = await fetch('/api/coupons/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode }),
    })
    const d = await r.json()
    if (d.valid) { setCoupon(d); toast.success(`Code ${d.code} appliqué`) }
    else { setCoupon(null); toast.error('Code invalide') }
  }

  const applyGift = async () => {
    if (!giftCode) return
    const r = await fetch('/api/gift-cards/verify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: giftCode }),
    })
    const d = await r.json()
    if (d.valid) { setGift(d); toast.success(`Carte cadeau · ${formatPrice(d.balance)} dispo`) }
    else { setGift(null); toast.error('Carte cadeau invalide') }
  }

  // Prices
  const discount = coupon
    ? (coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value)
    : 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const giftApplied = gift ? Math.min(gift.balance, afterDiscount) : 0
  const shippingCost = useMemo(() => {
    if (items.length === 0) return 0
    if (subtotal >= 150 && shippingMethod === 'standard') return 0
    return shippingMethod === 'express' ? 14.9 : 8.9
  }, [items.length, subtotal, shippingMethod])
  const total = Math.max(0, afterDiscount - giftApplied) + shippingCost

  const canPlace = email.includes('@')
    && addr.firstName && addr.lastName && addr.address && addr.city && addr.zip
    && items.length > 0 && !placing

  const placeOrder = async () => {
    if (!canPlace) return
    setPlacing(true)
    try {
      const fullAddress = {
        ...addr,
        name: `${addr.firstName} ${addr.lastName}`.trim(),
        email,
        shippingMethod,
      }
      const r = await fetch('/api/orders', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: fullAddress,
          couponCode: coupon?.code,
          giftCardCode: gift?.code,
        }),
      })
      const d = await r.json()
      if (r.ok) {
        setPlaced(d.order)
        await refresh()
        setCoupon(null); setGift(null)
        // Scroll to top to show confirmation
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        toast.error(d.error || 'Erreur lors du passage de commande')
      }
    } catch (e) {
      toast.error('Erreur réseau')
    } finally {
      setPlacing(false)
    }
  }

  // Confirmation state
  if (placed) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        <Header />
        <main className="flex-1 container max-w-2xl py-20 md:py-28">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="w-20 h-20 rounded-full bg-emerald/15 flex items-center justify-center mx-auto mb-8">
              <Check className="h-10 w-10 text-emerald" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Commande reçue</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-4">Merci {addr.firstName}.</h1>
            <p className="text-ink/70 mt-5 leading-relaxed">
              Votre commande <strong className="text-ink">{placed.orderNumber}</strong> est bien enregistrée.
              Un email de confirmation est en route vers <strong className="text-ink">{email}</strong>.
            </p>
          </motion.div>

          <div className="mt-12 border border-linen bg-cream/30 p-6 md:p-8 space-y-4">
            <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Récapitulatif</div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/70">Articles</span>
              <span className="tabular-nums">{placed.items?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-ink/70">Livraison</span>
              <span className="tabular-nums">
                {placed.shipping === 0 ? 'Offerte' : formatPrice(placed.shipping)}
              </span>
            </div>
            <div className="flex justify-between font-display text-xl border-t border-linen pt-4">
              <span>Total payé</span>
              <span className="tabular-nums">{formatPrice(placed.total)}</span>
            </div>
            {user && (
              <div className="flex items-center justify-between text-terracotta text-sm pt-2 border-t border-linen">
                <span>Points de fidélité gagnés</span>
                <span className="tabular-nums">+{Math.round(placed.total)} pts</span>
              </div>
            )}
          </div>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/collections"
              className="inline-flex items-center justify-center h-12 px-8 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition rounded-sm"
            >
              Continuer la découverte
            </Link>
            <Link
              href="/compte"
              className="inline-flex items-center justify-center h-12 px-8 border border-ink/20 text-ink text-[11px] uppercase tracking-[0.28em] hover:border-ink hover:bg-ink/5 transition rounded-sm"
            >
              Voir mes commandes
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Empty cart redirect UX
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-ivory flex flex-col">
        <Header />
        <main className="flex-1 container max-w-xl py-24 text-center">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Paiement</span>
          <h1 className="font-display text-4xl font-bold mt-3">Votre panier est vide.</h1>
          <p className="text-ink/60 mt-4">Ajoutez quelques pièces pour commencer la commande.</p>
          <Link
            href="/collections"
            className="inline-flex items-center justify-center h-12 px-8 mt-10 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition rounded-sm"
          >
            Découvrir la collection
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      <Header />
      <main className="flex-1 container max-w-6xl py-10 md:py-14">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-ink/50 mb-8">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-ink">Paiement</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-10 lg:gap-16">
          {/* ===== LEFT : Form ===== */}
          <div className="space-y-10">
            {/* Contact */}
            <Section number="1" title="Contact">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="vous@exemple.fr"
                required
              />
              {!user && (
                <p className="text-xs text-ink/50 mt-2">
                  Déjà client ?{' '}
                  <Link href="/compte" className="text-emerald hover:underline">
                    Se connecter
                  </Link>
                </p>
              )}
            </Section>

            {/* Delivery */}
            <Section number="2" title="Adresse de livraison">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Prénom" value={addr.firstName} onChange={(v) => setAddr({ ...addr, firstName: v })} required />
                <Input label="Nom" value={addr.lastName} onChange={(v) => setAddr({ ...addr, lastName: v })} required />
              </div>
              <Input label="Adresse" value={addr.address} onChange={(v) => setAddr({ ...addr, address: v })} placeholder="12 rue des oliviers" required />
              <Input label="Appartement, étage (optionnel)" value={addr.apt} onChange={(v) => setAddr({ ...addr, apt: v })} />
              <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                <Input label="Ville" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} required />
                <Input label="Code postal" value={addr.zip} onChange={(v) => setAddr({ ...addr, zip: v })} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Pays" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} required />
                <Input label="Téléphone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} placeholder="06 00 00 00 00" />
              </div>
            </Section>

            {/* Shipping method */}
            <Section number="3" title="Mode de livraison">
              <ShippingOption
                selected={shippingMethod === 'standard'}
                onSelect={() => setShippingMethod('standard')}
                icon={Truck}
                title="Livraison soignée"
                description="Emballage de l'atelier · 3 à 5 jours ouvrés"
                price={subtotal >= 150 ? 'Offerte' : formatPrice(8.9)}
              />
              <ShippingOption
                selected={shippingMethod === 'express'}
                onSelect={() => setShippingMethod('express')}
                icon={Zap}
                title="Express"
                description="Livraison en 24-48 h · Chronopost"
                price={formatPrice(14.9)}
              />
            </Section>

            {/* Payment */}
            <Section number="4" title="Paiement">
              <PaymentOption
                selected={paymentMethod === 'card'}
                onSelect={() => setPaymentMethod('card')}
                icon={CreditCard}
                title="Carte bancaire"
                description="Visa · Mastercard · American Express"
                badge="Sécurisé"
              />
              <PaymentOption
                selected={paymentMethod === 'apple'}
                onSelect={() => setPaymentMethod('apple')}
                icon={Apple}
                title="Apple Pay"
                description="Validation Touch ID / Face ID"
              />
              <PaymentOption
                selected={paymentMethod === 'paypal'}
                onSelect={() => setPaymentMethod('paypal')}
                icon={Wallet}
                title="PayPal"
                description="Connectez-vous à votre compte PayPal"
              />

              {/* Fake card preview — Stripe not configured yet */}
              {paymentMethod === 'card' && (
                <div className="mt-5 border border-linen bg-cream/40 p-5 rounded-sm space-y-4">
                  <div className="flex items-center gap-2 text-xs text-ink/60">
                    <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Les champs de carte apparaîtront ici (Stripe Elements)
                  </div>
                  <div className="h-11 border border-dashed border-ink/20 bg-ivory flex items-center px-4 text-sm text-ink/40">
                    1234 1234 1234 1234
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-11 border border-dashed border-ink/20 bg-ivory flex items-center px-4 text-sm text-ink/40">
                      MM / AA
                    </div>
                    <div className="h-11 border border-dashed border-ink/20 bg-ivory flex items-center px-4 text-sm text-ink/40">
                      CVC
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                    Intégration Stripe à venir
                  </p>
                </div>
              )}
            </Section>

            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition"
              >
                <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
                Retour à la boutique
              </Link>
            </div>
          </div>

          {/* ===== RIGHT : Order summary ===== */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-linen bg-cream/30 p-6 md:p-8 space-y-6">
              <div>
                <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50 mb-1">Récapitulatif</div>
                <h2 className="font-display text-2xl font-bold">
                  {items.length} article{items.length > 1 ? 's' : ''}
                </h2>
              </div>

              {/* Line items */}
              <ul className="space-y-4 max-h-[320px] overflow-auto pr-1">
                {items.map((it) => (
                  <li key={`${it.slug}::${it.variant || ''}::${it.size || ''}`} className="flex gap-3">
                    <div className="relative h-16 w-16 flex-shrink-0 bg-ivory overflow-hidden rounded-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      <span className="absolute -top-1.5 -right-1.5 bg-ink text-ivory text-[10px] rounded-full h-5 w-5 flex items-center justify-center">
                        {it.qty}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="text-sm font-medium leading-tight truncate">{it.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-ink/50 mt-0.5">
                        {[it.variant, it.size].filter(Boolean).join(' · ') || it.category}
                      </div>
                    </div>
                    <div className="text-sm tabular-nums self-center">{formatPrice(it.price * it.qty)}</div>
                  </li>
                ))}
              </ul>

              {/* Coupon + gift */}
              <div className="space-y-3 pt-4 border-t border-linen">
                <div className="flex gap-2 min-w-0">
                  <div className="flex-1 min-w-0 flex items-center gap-2 border border-ink/15 bg-ivory px-3">
                    <Tag className="h-3.5 w-3.5 text-ink/50" strokeWidth={1.5} />
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Code promo"
                      className="flex-1 bg-transparent text-sm outline-none py-2.5"
                    />
                    {coupon && <Check className="h-3.5 w-3.5 text-terracotta" />}
                  </div>
                  <button
                    onClick={applyCoupon}
                    className="px-4 border border-ink/20 text-[10px] uppercase tracking-[0.22em] hover:bg-ink hover:text-ivory transition"
                  >
                    Appliquer
                  </button>
                </div>
                <div className="flex gap-2 min-w-0">
                  <div className="flex-1 min-w-0 flex items-center gap-2 border border-ink/15 bg-ivory px-3">
                    <Gift className="h-3.5 w-3.5 text-ink/50" strokeWidth={1.5} />
                    <input
                      value={giftCode}
                      onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
                      placeholder="Carte cadeau"
                      className="flex-1 bg-transparent text-sm outline-none py-2.5"
                    />
                    {gift && <Check className="h-3.5 w-3.5 text-terracotta" />}
                  </div>
                  <button
                    onClick={applyGift}
                    className="px-4 border border-ink/20 text-[10px] uppercase tracking-[0.22em] hover:bg-ink hover:text-ivory transition"
                  >
                    Appliquer
                  </button>
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t border-linen text-sm">
                <Row label="Sous-total" value={formatPrice(subtotal)} />
                {discount > 0 && (
                  <Row
                    label={`Réduction (${coupon.code})`}
                    value={`− ${formatPrice(discount)}`}
                    color="text-terracotta"
                  />
                )}
                {giftApplied > 0 && (
                  <Row
                    label="Carte cadeau"
                    value={`− ${formatPrice(giftApplied)}`}
                    color="text-terracotta"
                  />
                )}
                <Row
                  label="Livraison"
                  value={shippingCost === 0 ? 'Offerte' : formatPrice(shippingCost)}
                />
                <div className="flex justify-between font-display text-2xl pt-3 border-t border-linen">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(total)}</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-ink/40">
                  TVA incluse
                </div>
              </div>

              <button
                onClick={placeOrder}
                disabled={!canPlace}
                className="w-full h-14 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-sm"
              >
                {placing ? (
                  'Enregistrement…'
                ) : (
                  <>
                    <Lock className="h-4 w-4" strokeWidth={1.5} />
                    Payer {formatPrice(total)}
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.24em] text-ink/50">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                Paiement 100 % sécurisé
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/* -------- helpers -------- */

function Section({ number, title, children }) {
  return (
    <section>
      <h2 className="flex items-center gap-3 mb-5">
        <span className="h-7 w-7 rounded-full bg-ink text-ivory text-xs flex items-center justify-center tabular-nums">
          {number}
        </span>
        <span className="font-display text-xl font-bold">{title}</span>
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Input({ label, value, onChange, placeholder, type = 'text', required = false }) {
  return (
    <label className="block min-w-0">
      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/60 mb-1">
        {label} {required && <span className="text-terracotta">*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 bg-ivory border border-ink/15 focus:border-ink outline-none px-4 text-sm transition-colors"
        required={required}
      />
    </label>
  )
}

function ShippingOption({ selected, onSelect, icon: Icon, title, description, price }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 border transition text-left ${
        selected ? 'border-ink bg-cream/40' : 'border-linen hover:border-ink/40'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-ink' : 'border-ink/30'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      <Icon className="h-5 w-5 text-ink/60" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-ink/60 mt-0.5">{description}</div>
      </div>
      <div className="text-sm font-medium tabular-nums">{price}</div>
    </button>
  )
}

function PaymentOption({ selected, onSelect, icon: Icon, title, description, badge }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 border transition text-left ${
        selected ? 'border-ink bg-cream/40' : 'border-linen hover:border-ink/40'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-ink' : 'border-ink/30'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
      </span>
      <Icon className="h-5 w-5 text-ink/60" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="font-medium flex items-center gap-2">
          {title}
          {badge && (
            <span className="text-[9px] uppercase tracking-[0.22em] bg-emerald/15 text-emerald px-2 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-ink/60 mt-0.5">{description}</div>
      </div>
    </button>
  )
}

function Row({ label, value, color = '' }) {
  return (
    <div className={`flex justify-between ${color}`}>
      <span className={color || 'text-ink/70'}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}
