'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useCart } from './cart-provider'
import { formatPrice } from '@/lib/utils'

export default function CartDrawer() {
  const { items, subtotal, open, setOpen, update, remove } = useCart()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/50 z-50"
            onClick={() => setOpen(false)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-ivory z-50 flex flex-col shadow-2xl"
          >
            <header className="flex items-center justify-between p-6 border-b border-linen/60">
              <div>
                <div className="font-display text-xl font-bold">Votre panier</div>
                <div className="text-[11px] uppercase tracking-[0.24em] text-ink/50 mt-0.5">
                  {items.length === 0 ? 'Vide pour l\u2019instant' : `${items.length} article${items.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="hover:opacity-60 transition">
                <X className="h-5 w-5" strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-auto">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center px-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-linen/60 flex items-center justify-center mb-5">
                    <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
                  </div>
                  <p className="font-display text-2xl mb-2">Le silence, avant les objets.</p>
                  <p className="text-sm text-ink/60 mb-6">Découvrez nos créations et laissez-en une entrer chez vous.</p>
                  <button
                    onClick={() => setOpen(false)}
                    className="inline-block bg-ink text-ivory px-8 py-3 text-[11px] uppercase tracking-[0.24em] hover:bg-terracotta transition-colors"
                  >
                    <Link href="/collections">Découvrir la collection</Link>
                  </button>
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
                          <button onClick={() => remove(it.slug)} className="text-[11px] uppercase tracking-[0.18em] text-ink/50 hover:text-terracotta transition">Retirer</button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center border border-linen">
                            <button onClick={() => update(it.slug, Math.max(1, it.qty - 1))} className="p-2 hover:bg-linen/40 transition" aria-label="Diminuer"><Minus className="h-3 w-3" strokeWidth={1.5} /></button>
                            <span className="w-8 text-center text-sm tabular-nums">{it.qty}</span>
                            <button onClick={() => update(it.slug, it.qty + 1)} className="p-2 hover:bg-linen/40 transition" aria-label="Augmenter"><Plus className="h-3 w-3" strokeWidth={1.5} /></button>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink/70">Sous-total</span>
                  <span className="font-medium tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="text-xs text-ink/50">Livraison offerte dès 150 €. Emballage soigné et neutre en carbone.</div>
                <button className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors">
                  Procéder au paiement
                </button>
                <button onClick={() => setOpen(false)} className="w-full text-[11px] uppercase tracking-[0.24em] text-ink/60 hover:text-ink transition">
                  Continuer mes achats
                </button>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
