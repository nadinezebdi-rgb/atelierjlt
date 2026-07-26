'use client'

import { useState } from 'react'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Instagram, Facebook, Mail, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const r = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (r.ok) {
        toast.success('Message envoyé. Nous revenons vers vous rapidement.')
        setForm({ name: '', email: '', message: '' })
      } else toast.error('Champs invalides.')
    } catch { toast.error('Réseau indisponible.') }
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main className="container py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-xl mb-16">
          <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Nous contacter</span>
          <h1 className="font-display font-bold text-5xl md:text-6xl mt-4 leading-[1.02]">Nous écrivons de vraies réponses.</h1>
          <p className="text-ink/60 mt-4 leading-relaxed">Une question, un projet, une commande spéciale ? Notre atelier est joignable du lundi au vendredi.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          <form onSubmit={submit} className="space-y-6">
            <Field label="Votre nom">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
            </Field>
            <Field label="Votre email">
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
            </Field>
            <Field label="Votre message">
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 resize-none" />
            </Field>
            <button disabled={sending} className="bg-ink text-ivory px-10 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors disabled:opacity-70">
              {sending ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>

          <div className="space-y-8 md:pl-10 md:border-l border-linen">
            <InfoRow icon={Mail} title="Bonjour" value="bonjour@ginette-creations.fr" />
            <InfoRow icon={MapPin} title="Atelier" value="Vieux mas, La Roche-sur-Grâne — Drôme" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50 mb-3">Suivez-nous</div>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 rounded-full border border-ink/20 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>
                <a href="#" className="h-10 w-10 rounded-full border border-ink/20 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition"><Facebook className="h-4 w-4" strokeWidth={1.5} /></a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <CartDrawer />
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

function InfoRow({ icon: Icon, title, value }) {
  return (
    <div className="flex gap-4">
      <div className="h-10 w-10 rounded-full bg-cream flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-terracotta" strokeWidth={1.5} />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50">{title}</div>
        <div className="font-display text-lg mt-1">{value}</div>
      </div>
    </div>
  )
}
