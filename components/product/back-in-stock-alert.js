'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'

/** Bloc « Épuisé » + inscription à l'alerte de retour en stock (fiche produit). */
export default function BackInStockAlert({ slug, variant, size, label }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Pré-remplit avec l'email du compte client si connecté
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.user?.email && setEmail((e) => e || d.user.email))
      .catch(() => {})
  }, [])
  // Nouvelle combinaison choisie → nouveau formulaire
  useEffect(() => { setDone(false); setError('') }, [variant, size])
  // Nombre de personnes déjà en attente (pour cette couleur)
  const [waiting, setWaiting] = useState(0)
  useEffect(() => {
    const q = new URLSearchParams({ slug })
    if (variant) q.set('variant', variant)
    fetch(`/api/stock-alerts?${q}`).then((r) => r.json()).then((d) => setWaiting(Number(d.waiting) || 0)).catch(() => {})
  }, [slug, variant, done])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const r = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, variant, size, email }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Inscription impossible')
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-10 border border-ink/15 bg-cream/40 p-5" data-testid="back-in-stock">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-terracotta">
        <span className="h-2 w-2 rounded-full bg-terracotta" /> Épuisé{label ? ` — ${label}` : ''}
      </div>
      {waiting > 0 && (
        <p className="mt-2 text-xs text-ink/60" data-testid="back-in-stock-waiting">
          {waiting === 1 ? '1 personne attend' : `${waiting} personnes attendent`} son retour
        </p>
      )}
      {done ? (
        <p className="mt-3 text-sm text-ink/80 flex items-start gap-2" data-testid="back-in-stock-done">
          <Check className="h-4 w-4 text-emerald mt-0.5 flex-none" strokeWidth={2} />
          C’est noté ! Nous vous écrirons à <strong className="font-medium">{email}</strong> dès que cette pièce sera de retour.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink/70 leading-relaxed">
            Cette pièce faite main reviendra bientôt. Laissez votre email : vous serez prévenu(e) dès son retour en stock.
          </p>
          <form onSubmit={submit} className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre adresse email"
              aria-label="Votre adresse email"
              data-testid="back-in-stock-email"
              className="flex-1 h-12 bg-ivory border border-ink/20 px-3 text-sm focus:outline-none focus:border-emerald"
            />
            <button
              disabled={busy}
              data-testid="back-in-stock-submit"
              className="h-12 px-5 bg-ink text-ivory text-[11px] uppercase tracking-[0.22em] hover:bg-emerald transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" strokeWidth={1.5} />}
              M’alerter du retour
            </button>
          </form>
          {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
        </>
      )}
    </div>
  )
}
