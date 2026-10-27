'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'

function ResetForm() {
  const token = useSearchParams().get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Les deux mots de passe ne correspondent pas.'); return }
    setBusy(true)
    const r = await fetch('/api/auth/reset-password', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    }).catch(() => null)
    const d = await r?.json().catch(() => ({}))
    setBusy(false)
    if (r?.ok) {
      toast.success('Mot de passe mis à jour')
      window.location.href = '/compte'
    } else {
      setError(d?.error || 'Une erreur est survenue')
    }
  }

  if (!token) {
    return (
      <p className="mt-8 text-ink/70">
        Ce lien est incomplet. <Link href="/compte" className="underline underline-offset-4 hover:text-terracotta">Demander un nouveau lien</Link>
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5 mt-10" data-testid="reset-form">
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Nouveau mot de passe</span>
        <input data-testid="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-[0.28em] text-ink/60">Confirmer le mot de passe</span>
        <input data-testid="reset-confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
      </label>
      {error && <p className="text-sm text-terracotta" data-testid="reset-error">{error}</p>}
      <button disabled={busy} className="w-full bg-ink text-ivory py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors disabled:opacity-70">
        {busy ? '…' : 'Enregistrer mon mot de passe'}
      </button>
      {error && (
        <p className="text-center text-xs text-ink/60">
          <Link href="/compte" className="underline underline-offset-4 hover:text-terracotta">Demander un nouveau lien</Link>
        </p>
      )}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container py-16 md:py-24 max-w-6xl">
        <div className="max-w-md mx-auto">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Mon compte</span>
          <h1 className="font-display font-bold text-4xl md:text-5xl mt-3 leading-tight">Nouveau mot de passe.</h1>
          <p className="text-ink/60 mt-3">Choisissez un mot de passe d’au moins 6 caractères.</p>
          <Suspense fallback={null}><ResetForm /></Suspense>
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
