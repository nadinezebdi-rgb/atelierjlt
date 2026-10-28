'use client'

/** Admin : interrupteur « Ventes ouvertes ». Bloqué tant qu'aucun paiement en ligne n'est branché. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Store, Lock } from 'lucide-react'

export default function SalesSwitch() {
  const [s, setS] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = () => fetch('/api/admin/shop', { credentials: 'include' }).then((r) => r.json()).then(setS).catch(() => setS({ error: true }))
  useEffect(() => { load() }, [])

  const toggle = async () => {
    const next = !s?.salesOpen
    setBusy(true)
    const r = await fetch('/api/admin/shop', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salesOpen: next }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return toast.error(d.error || 'Modification impossible')
    toast.success(next ? 'Ventes ouvertes' : 'Ventes fermées')
    load()
  }

  if (!s) return null
  const locked = !s.paymentReady
  return (
    <section className={`border p-4 mb-6 flex flex-wrap items-center gap-4 ${s.salesOpen ? 'border-emerald bg-emerald/5' : 'border-amber-300 bg-amber-50'}`} data-testid="sales-switch">
      <Store className={`h-5 w-5 ${s.salesOpen ? 'text-emerald' : 'text-amber-800'}`} strokeWidth={1.5} />
      <div className="flex-1 min-w-[220px]">
        <div className="font-display text-lg">{s.salesOpen ? 'Ventes ouvertes' : 'Ventes fermées'}</div>
        <p className="text-xs text-ink/65 mt-0.5 leading-relaxed">
          {s.salesOpen
            ? 'Les clients peuvent commander et payer en ligne.'
            : 'Les prix restent visibles, mais le panier et la commande sont désactivés : les visiteurs voient « Bientôt disponible ».'}
          {' '}{s.waitlist > 0 && <strong>{s.waitlist} personne{s.waitlist > 1 ? 's' : ''} attend{s.waitlist > 1 ? 'ent' : ''} l’ouverture.</strong>}
        </p>
        {locked && (
          <p className="text-xs text-amber-900 mt-1 inline-flex items-center gap-1.5" data-testid="sales-locked">
            <Lock className="h-3.5 w-3.5" /> L’ouverture sera possible une fois le paiement en ligne branché (compte professionnel nécessaire).
          </p>
        )}
      </div>
      <button
        type="button" role="switch" aria-checked={!!s.salesOpen} aria-label="Ventes ouvertes"
        onClick={toggle} disabled={busy || (locked && !s.salesOpen)}
        data-testid="sales-toggle"
        className={`relative h-7 w-12 rounded-full transition ${s.salesOpen ? 'bg-emerald' : 'bg-ink/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${s.salesOpen ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </section>
  )
}
