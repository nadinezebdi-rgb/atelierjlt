'use client'

/** Ventes fermées : « Bientôt disponible » + inscription pour être prévenu(e) de l'ouverture. */
import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Check } from 'lucide-react'

export default function SalesSoonNotice({ slug = null, compact = false }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    const r = await fetch('/api/shop/notify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, slug }),
    }).catch(() => null)
    const d = await r?.json().catch(() => ({}))
    setBusy(false)
    if (r?.ok) { setDone(true); toast.success('C’est noté, nous vous écrirons à l’ouverture') }
    else toast.error(d?.error || 'Inscription impossible pour le moment')
  }

  return (
    <div className={`${compact ? 'mt-4' : 'mt-10'} border border-emerald/30 bg-emerald/5 p-5`} data-testid="sales-soon">
      <div className="flex items-center gap-2 text-emerald">
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        <span className="text-[11px] uppercase tracking-[0.28em]">Bientôt disponible</span>
      </div>
      <p className="text-sm text-ink/70 mt-2 leading-relaxed">
        La boutique en ligne ouvre très prochainement. Laissez votre e-mail : nous vous prévenons dès que les commandes sont possibles.
      </p>
      {done ? (
        <p className="mt-4 text-sm text-emerald inline-flex items-center gap-1.5" data-testid="sales-soon-done">
          <Check className="h-4 w-4" /> Merci ! Vous serez prévenu(e) à l’ouverture.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 flex gap-2">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr" data-testid="sales-soon-email"
            className="flex-1 min-w-0 bg-transparent border-b border-ink/25 focus:border-ink outline-none py-2 text-sm"
          />
          <button disabled={busy} data-testid="sales-soon-submit" className="px-4 bg-emerald text-ivory text-[10px] uppercase tracking-[0.22em] hover:bg-emeraldDark transition disabled:opacity-60">
            {busy ? '…' : 'Me prévenir'}
          </button>
        </form>
      )}
      <p className="mt-2 text-[11px] text-ink/45">Un seul e-mail à l’ouverture, pas d’autre envoi.</p>
    </div>
  )
}
