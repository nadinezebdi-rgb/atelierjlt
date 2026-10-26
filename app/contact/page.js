'use client'

import { useEffect, useState } from 'react'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import PageEditShell from '@/components/edit/page-edit-shell'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Instagram, Facebook, Mail } from 'lucide-react'

import { CONTACT_DEFAULTS, CONTACT_FIELDS } from '@/lib/page-content-config'

const DEFAULT_CONTENT = CONTACT_DEFAULTS
const EDIT_FIELDS = CONTACT_FIELDS

export default function ContactPage() {
  const [content, setContent] = useState(DEFAULT_CONTENT)
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/site-content')
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const contact = d?.content?.contact || {}
        setContent({ ...DEFAULT_CONTENT, ...contact })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

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
        toast.success(content.successMessage || DEFAULT_CONTENT.successMessage)
        setForm({ name: '', email: '', message: '' })
      } else toast.error(content.errorMessage || DEFAULT_CONTENT.errorMessage)
    } catch { toast.error('Réseau indisponible.') }
    setSending(false)
  }

  const c = content

  return (
    <div className="min-h-screen bg-ivory">
      <PageEditShell
        pageKey="contact"
        label="Contact"
        initialContent={content}
        fields={EDIT_FIELDS}
        onChange={setContent}
      />

      <Header />
      <main className="container py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="max-w-xl mb-16">
          {c.eyebrow && (
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">{c.eyebrow}</span>
          )}
          {c.title && (
            <h1 className="font-display font-bold text-5xl md:text-6xl mt-4 leading-[1.02] whitespace-pre-line">
              {c.title}
            </h1>
          )}
          {c.description && (
            <p className="text-ink/60 mt-4 leading-relaxed whitespace-pre-line">{c.description}</p>
          )}
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 md:gap-20">
          <form onSubmit={submit} className="space-y-6">
            <Field label={c.formNameLabel || DEFAULT_CONTENT.formNameLabel}>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
            </Field>
            <Field label={c.formEmailLabel || DEFAULT_CONTENT.formEmailLabel}>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3" />
            </Field>
            <Field label={c.formMessageLabel || DEFAULT_CONTENT.formMessageLabel}>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full bg-transparent border-b border-ink/20 focus:border-ink outline-none py-3 resize-none" />
            </Field>
            <button disabled={sending} className="bg-ink text-ivory px-10 py-4 text-[11px] uppercase tracking-[0.28em] hover:bg-terracotta transition-colors disabled:opacity-70">
              {sending ? (c.formButtonSending || DEFAULT_CONTENT.formButtonSending) : (c.formButtonLabel || DEFAULT_CONTENT.formButtonLabel)}
            </button>
          </form>

          <div className="space-y-8 md:pl-10 md:border-l border-linen">
            {c.infoEmailValue && (
              <InfoRow icon={Mail} title={c.infoEmailTitle} value={c.infoEmailValue} />
            )}
            {(c.showInstagram !== false || c.showFacebook !== false) && (
              <div>
                {c.socialTitle && (
                  <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50 mb-3">
                    {c.socialTitle}
                  </div>
                )}
                <div className="flex gap-4">
                  {c.showInstagram !== false && c.instagramUrl && (
                    <a
                      href={c.instagramUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full border border-ink/20 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  )}
                  {c.showFacebook !== false && c.facebookUrl && (
                    <a
                      href={c.facebookUrl}
                      target="_blank" rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full border border-ink/20 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition"
                      aria-label="Facebook"
                    >
                      <Facebook className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  )}
                </div>
              </div>
            )}
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
        {title && (
          <div className="text-[10px] uppercase tracking-[0.28em] text-ink/50">{title}</div>
        )}
        <div className="font-display text-lg mt-1 whitespace-pre-line">{value}</div>
      </div>
    </div>
  )
}
