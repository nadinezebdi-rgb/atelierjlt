'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) return toast.error('Email invalide')
    setLoading(true)
    try {
      const r = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (r.ok) {
        toast.success('Merci, à très vite dans votre boîte de réception.')
        setEmail('')
      } else toast.error('Une erreur est survenue.')
    } catch { toast.error('Réseau indisponible.') }
    setLoading(false)
  }

  return (
    <section className="py-24 md:py-32 bg-linen/60">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="container max-w-2xl text-center"
      >
        <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Le journal</span>
        <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">
          Recevez les nouveautés avant tout le monde.
        </h2>
        <p className="text-ink/60 mt-4">Un mail rare et soigné. Nouveautés, éditions limitées, coulisses de l'atelier.</p>
        <form onSubmit={submit} className="mt-10 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre adresse email"
            className="flex-1 bg-transparent border-b border-ink/30 focus:border-ink outline-none py-3 px-1 text-center sm:text-left placeholder:text-ink/40"
            required
          />
          <button
            disabled={loading}
            className="bg-ink text-ivory px-8 py-3 text-[11px] uppercase tracking-[0.28em] hover:bg-plantes transition-colors disabled:opacity-70"
          >
            {loading ? '…' : "S'inscrire"}
          </button>
        </form>
      </motion.div>
    </section>
  )
}
