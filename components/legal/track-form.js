'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Truck, ExternalLink, Loader2 } from 'lucide-react'
import { ORDER_STEPS, getTrackingUrl, carrierLabel } from '@/lib/tracking'

export default function TrackForm() {
  const [number, setNumber] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError(''); setOrder(null)
    try {
      const r = await fetch(`/api/orders/track?number=${encodeURIComponent(number.trim())}&email=${encodeURIComponent(email.trim())}`)
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Commande introuvable')
      setOrder(d.order)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const cancelled = order?.status === 'cancelled'
  const stepIdx = order ? Math.max(0, ORDER_STEPS.findIndex(([v]) => v === order.status)) : 0
  const url = order ? getTrackingUrl(order) : ''

  return (
    <div className="mt-10" data-testid="track-form">
      <form onSubmit={submit} className="border border-linen bg-cream/30 p-5 md:p-6 grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-2">N° de commande</span>
          <input value={number} onChange={(e) => setNumber(e.target.value)} required placeholder="JLT-…" className="w-full bg-ivory border border-ink/15 px-3 h-12 text-sm focus:outline-none focus:border-emerald uppercase" data-testid="track-number" />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-2">Email de la commande</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@exemple.fr" className="w-full bg-ivory border border-ink/15 px-3 h-12 text-sm focus:outline-none focus:border-emerald" data-testid="track-email" />
        </label>
        <button disabled={busy} className="h-12 px-6 bg-ink text-ivory text-[11px] uppercase tracking-[0.24em] hover:bg-emerald transition disabled:opacity-50 inline-flex items-center justify-center gap-2" data-testid="track-submit">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Suivre
        </button>
      </form>
      <p className="mt-3 text-xs text-ink/55">
        Vous avez un compte ? Retrouvez toutes vos commandes dans <Link href="/compte" className="underline hover:text-emerald">votre espace client</Link>.
      </p>

      {error && <p className="mt-5 text-sm text-terracotta" data-testid="track-error">{error}</p>}

      {order && (
        <div className="mt-6 border border-linen bg-ivory p-5 md:p-6" data-testid="track-result">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-display text-xl">{order.orderNumber}</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
              {new Date(order.createdAt).toLocaleDateString('fr-FR')} · {order.itemsCount} article{order.itemsCount > 1 ? 's' : ''}
            </div>
          </div>
          {cancelled ? (
            <p className="mt-4 text-sm text-terracotta">Cette commande a été annulée.</p>
          ) : (
            <ol className="mt-6 grid grid-cols-4 gap-1">
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
                  </li>
                )
              })}
            </ol>
          )}
          {order.trackingNumber && (
            <div className="mt-6 flex flex-wrap items-center gap-3 bg-cream/40 border border-linen p-4">
              <Truck className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              <span className="text-sm">{carrierLabel(order.carrier)} · n° <strong className="tabular-nums">{order.trackingNumber}</strong></span>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="ml-auto h-10 px-4 inline-flex items-center gap-2 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] hover:bg-emeraldDark">
                  Suivre mon colis <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
