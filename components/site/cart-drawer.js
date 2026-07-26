'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag, Tag, Gift, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useCart } from './cart-provider'
import { useAuth } from './auth-provider'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export default function CartDrawer() {
  const { items, subtotal, open, setOpen, update, remove, refresh } = useCart()
  const { user } = useAuth()
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [giftCode, setGiftCode] = useState('')
  const [gift, setGift] = useState(null)
  const [step, setStep] = useState('cart') // cart | checkout | done
  const [addr, setAddr] = useState({ name: user?.name || '', email: user?.email || '', address: '', city: '', zip: '', country: 'France', phone: '' })
  const [placed, setPlaced] = useState(null)

  const applyCoupon = async () => {
    const r = await fetch('/api/coupons/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) })
    const d = await r.json()
    if (d.valid) { setCoupon(d); toast.success(`Code ${d.code} appliqué`) }
    else toast.error('Code invalide')
  }
  const applyGift = async () => {
    const r = await fetch('/api/gift-cards/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: giftCode }) })
    const d = await r.json()
    if (d.valid) { setGift(d); toast.success(`Carte cadeau : ${formatPrice(d.balance)} disponibles`) }
    else toast.error('Carte cadeau invalide')
  }

  const discount = coupon ? (coupon.type === 'percent' ? Math.round(subtotal * coupon.value / 100) : coupon.value) : 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const giftApplied = gift ? Math.min(gift.balance, afterDiscount) : 0
  const shipping = subtotal >= 150 ? 0 : (items.length ? 8.9 : 0)
  const total = Math.max(0, afterDiscount - giftApplied) + shipping

  const placeOrder = async () => {
    const r = await fetch('/api/orders', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: addr, couponCode: coupon?.code, giftCardCode: gift?.code }),
    })
    const d = await r.json()
    if (r.ok) { setPlaced(d.order); setStep('done'); await refresh(); setCoupon(null); setGift(null) }
    else toast.error(d.error || 'Erreur')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/50 z-50" onClick={() => { setOpen(false); setStep('cart') }} />
          <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-ivory z-50 flex flex-col shadow-2xl">
            <header className="flex items-center justify-between p-6 border-b border-linen/60">
              <div>
                <div className="font-display text-xl font-bold">{step === 'checkout' ? 'Livraison' : step === 'done' ? 'Merci' : 'Votre panier'}</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-ink/50 mt-0.5">
                  {step === 'done' ? placed?.orderNumber : items.length === 0 ? "Vide pour l'instant" : `${items.length} article${items.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <button onClick={() => { setOpen(false); setStep('cart') }} aria-label="Fermer" className="hover:opacity-60 transition"><X className="h-5 w-5" strokeWidth={1.5} /></button>
            </header>

            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-auto">
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-linen/60 flex items-center justify-center mb-5"><ShoppingBag className="h-6 w-6" strokeWidth={1.5} /></div>
                      <p className="font-display text-2xl mb-2">Le silence, avant les objets.</p>
                      <p className="text-sm text-ink/60 mb-6">Découvrez nos créations et laissez-en une entrer chez vous.</p>
                      <Link href="/collections" onClick={() => setOpen(false)} className="inline-block bg-ink text-ivory px-8 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition">Découvrir la collection</Link>
                    </div>
                  ) : (
                    <ul className="divide-y divide-linen/60">
                      {items.map((it) => (
                        <li key={it.slug} className="flex gap-4 p-6">
                          <div className="h-24 w-20 flex-shrink-0 bg-cream overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-display text-base leading-tight">{it.name}</div>
                                <div className="text-[11px] uppercase tracking-[0.18em] text-ink/50 mt-1">{it.category}</div>
                              </div>
                              <button onClick={() => remove(it.slug)} className="text-[11px] uppercase tracking-[0.18em] text-ink/50 hover:text-terracotta">Retirer</button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center border border-linen">
                                <button onClick={() => update(it.slug, Math.max(1, it.qty - 1))} className="p-2 hover:bg-linen/40"><Minus className="h-3 w-3" strokeWidth={1.5} /></button>
                                <span className="w-8 text-center text-sm tabular-nums">{it.qty}</span>
                                <button onClick={() => update(it.slug, it.qty + 1)} className="p-2 hover:bg-linen/40"><Plus className="h-3 w-3" strokeWidth={1.5} /></button>
                              </div>
                              <div className="text-sm font-medium tabular-nums">{formatPrice(it.price * it.qty)}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {items.length > 0 && (
                  <footer className="border-t border-linen/60 p-6 space-y-4">
                    {/* Coupon */}
                    <div className="border border-linen">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Tag className="h-3.5 w-3.5 text-terracotta" strokeWidth={1.5} />
                        <input placeholder="Code promo" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="flex-1 bg-transparent text-sm outline-none py-1" />
                        <button onClick={applyCoupon} className="text-[10px] uppercase tracking-[0.22em] px-3 py-1 hover:text-terracotta transition">{coupon ? <Check className="h-3 w-3 text-terracotta" /> : 'Appliquer'}</button>
                      </div>
                      {coupon && <div className="text-[11px] px-3 pb-2 text-terracotta">{coupon.label || coupon.code} appliqué</div>}
                    </div>
                    {/* Gift card */}
                    <div className="border border-linen">
                      <div className="flex items-center gap-2 px-3 py-2">
                        <Gift className="h-3.5 w-3.5 text-terracotta" strokeWidth={1.5} />
                        <input placeholder="Carte cadeau" value={giftCode} onChange={(e) => setGiftCode(e.target.value.toUpperCase())} className="flex-1 bg-transparent text-sm outline-none py-1" />
                        <button onClick={applyGift} className="text-[10px] uppercase tracking-[0.22em] px-3 py-1 hover:text-terracotta transition">{gift ? <Check className="h-3 w-3 text-terracotta" /> : 'Appliquer'}</button>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <Row label="Sous-total" value={formatPrice(subtotal)} />
                      {discount > 0 && <Row label={`Réduction (${coupon.code})`} value={`- ${formatPrice(discount)}`} color="text-terracotta" />}
                      {giftApplied > 0 && <Row label="Carte cadeau" value={`- ${formatPrice(giftApplied)}`} color="text-terracotta" />}
                      <Row label="Livraison" value={shipping === 0 ? 'Offerte' : formatPrice(shipping)} />
                      <div className="border-t border-linen/60 pt-2 mt-2 flex justify-between font-display text-lg"><span>Total</span><span className="tabular-nums">{formatPrice(total)}</span></div>
                    </div>

                    <button onClick={() => setStep('checkout')} className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition flex items-center justify-center gap-2">
                      Passer commande <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                    <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 text-center">Livraison offerte dès 150 € · Paiement sécurisé</div>
                  </footer>
                )}
              </>
            )}

            {step === 'checkout' && (
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div className="text-[11px] uppercase tracking-[0.24em] text-ink/60">Coordonnées de livraison</div>
                <Input placeholder="Nom complet" value={addr.name} onChange={(v) => setAddr({ ...addr, name: v })} />
                <Input placeholder="Email" value={addr.email} onChange={(v) => setAddr({ ...addr, email: v })} />
                <Input placeholder="Téléphone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
                <Input placeholder="Adresse" value={addr.address} onChange={(v) => setAddr({ ...addr, address: v })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Ville" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
                  <Input placeholder="Code postal" value={addr.zip} onChange={(v) => setAddr({ ...addr, zip: v })} />
                </div>
                <Input placeholder="Pays" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} />
                <div className="pt-4 border-t border-linen/60 space-y-2">
                  <div className="flex justify-between font-display text-lg"><span>Total à payer</span><span className="tabular-nums">{formatPrice(total)}</span></div>
                  <button onClick={placeOrder} disabled={!addr.name || !addr.email || !addr.address} className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition disabled:opacity-50">
                    Valider la commande
                  </button>
                  <p className="text-[10px] text-ink/50 text-center italic">Paiement Stripe à venir — cette commande sera confirmée par email.</p>
                  <button onClick={() => setStep('cart')} className="w-full text-[11px] uppercase tracking-[0.22em] text-ink/60 hover:text-ink py-2">Retour au panier</button>
                </div>
              </div>
            )}

            {step === 'done' && placed && (
              <div className="flex-1 overflow-auto p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-terracotta/15 flex items-center justify-center mx-auto mb-6"><Check className="h-8 w-8 text-terracotta" strokeWidth={1.5} /></div>
                <h3 className="font-display text-3xl mb-2">Merci.</h3>
                <p className="text-ink/60 mb-6">Votre commande <strong>{placed.orderNumber}</strong> est enregistrée. Nous préparons vos pièces avec soin.</p>
                <div className="border border-linen p-4 text-left text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-ink/60">Articles</span><span>{placed.items.length}</span></div>
                  <div className="flex justify-between"><span className="text-ink/60">Total</span><span className="font-display tabular-nums">{formatPrice(placed.total)}</span></div>
                  {user && <div className="flex justify-between text-terracotta"><span>Points gagnés</span><span>+{Math.round(placed.total)} pts</span></div>}
                </div>
                <button onClick={() => { setOpen(false); setStep('cart') }} className="mt-6 bg-ink text-ivory px-8 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition">Continuer</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
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
function Input({ placeholder, value, onChange }) {
  return (
    <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 text-sm" />
  )
}
