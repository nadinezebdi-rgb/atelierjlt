'use client'

/** Admin → Commandes : état de l'envoi des emails, aperçu des modèles, relances panier, historique. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Mail, ChevronDown, Send, CheckCircle2, AlertCircle, Monitor, Smartphone, ShoppingBag, RefreshCw } from 'lucide-react'

const KIND = {
  order_confirmation: 'Confirmation de commande',
  owner_new_order: 'Nouvelle commande (vous)',
  order_shipped: 'Colis expédié',
  back_in_stock: 'Retour en stock',
  password_reset: 'Mot de passe oublié',
  welcome: 'Bienvenue',
  cart_reminder_1: 'Panier abandonné — relance 1',
  cart_reminder_2: 'Panier abandonné — relance 2',
  test: 'Email de test',
  generic: 'Email',
}
const STATUS = {
  sent: ['Envoyé', 'text-emerald'],
  failed: ['Échec', 'text-terracotta'],
  not_configured: ['Non envoyé (envoi inactif)', 'text-ink/50'],
}
const fmt = (d) => d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'
const eur = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`

export default function EmailsPanel() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [kind, setKind] = useState('welcome')
  const [preview, setPreview] = useState(null)
  const [device, setDevice] = useState('desktop')
  const [running, setRunning] = useState(false)

  const load = () =>
    fetch('/api/admin/emails', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setTo((t) => t || d.ownerEmail || '') })
      .catch(() => setData({ configured: false, logs: [], carts: [] }))
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!open) return
    setPreview(null)
    fetch(`/api/admin/emails/preview?kind=${encodeURIComponent(kind)}`, { credentials: 'include' })
      .then((r) => r.json()).then(setPreview).catch(() => setPreview({ error: true }))
  }, [kind, open])

  const sendTest = async (withKind) => {
    setBusy(true)
    const r = await fetch('/api/admin/emails', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, kind: withKind || undefined }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) toast.success(`Email de test envoyé à ${to}`)
    else if (d.error === 'not_configured') toast.message('L’envoi des emails n’est pas encore activé')
    else toast.error(d.error === 'send_failed' ? `Échec de l’envoi${d.detail ? ' : ' + d.detail : ''}` : (d.error || 'Erreur'))
    load()
  }

  const runReminders = async () => {
    setRunning(true)
    const r = await fetch('/api/admin/emails/run-reminders', { method: 'POST', credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    setRunning(false)
    if (!d.configured) toast.message('L’envoi des emails n’est pas encore activé')
    else if (d.sent) toast.success(`${d.sent} relance${d.sent > 1 ? 's' : ''} envoyée${d.sent > 1 ? 's' : ''}`)
    else toast.message('Aucune relance à envoyer pour le moment')
    load()
  }

  const logs = data?.logs || []
  const carts = data?.carts || []
  const kinds = data?.kinds || preview?.kinds || []

  return (
    <section className="border border-linen bg-ivory mb-6" data-testid="emails-panel">
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-4 flex flex-wrap items-center gap-3 text-left" data-testid="emails-panel-toggle">
        <Mail className="h-5 w-5 text-emerald" strokeWidth={1.5} />
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-lg">Emails clients</div>
          <div className="text-xs mt-0.5 inline-flex flex-wrap items-center gap-1.5">
            {data?.configured
              ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> <span className="text-emerald">Envoi actif</span></>
              : <><AlertCircle className="h-3.5 w-3.5 text-terracotta" /> <span className="text-terracotta">Envoi pas encore activé</span></>}
            <span className="text-ink/50">· {logs.length} email{logs.length > 1 ? 's' : ''} récent{logs.length > 1 ? 's' : ''} · {carts.length} panier{carts.length > 1 ? 's' : ''} en attente</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="border-t border-linen p-4 space-y-8 text-sm">
          <p className="text-xs text-ink/60 leading-relaxed">
            Envoyés automatiquement : bienvenue (avec le code BIENVENUE10), confirmation de commande, alerte « nouvelle commande » à {data?.ownerEmail || 'l’atelier'}, colis expédié avec lien de suivi, retour en stock, relances de panier abandonné (3 h puis 3 jours après) et mot de passe oublié. Les réponses des clients arrivent à contact@atelierjlt.fr.
          </p>

          {/* --- Aperçu --- */}
          <div data-testid="email-preview">
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Aperçu des emails</div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <select value={kind} onChange={(e) => setKind(e.target.value)} data-testid="email-preview-kind" className="h-10 px-3 bg-transparent border border-ink/20 focus:border-ink outline-none flex-1 min-w-[220px]">
                {kinds.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <div className="inline-flex border border-ink/20">
                <button type="button" onClick={() => setDevice('desktop')} aria-label="Aperçu ordinateur" className={`h-10 w-10 flex items-center justify-center ${device === 'desktop' ? 'bg-ink text-ivory' : ''}`}><Monitor className="h-4 w-4" strokeWidth={1.5} /></button>
                <button type="button" onClick={() => setDevice('mobile')} aria-label="Aperçu mobile" data-testid="email-preview-mobile" className={`h-10 w-10 flex items-center justify-center ${device === 'mobile' ? 'bg-ink text-ivory' : ''}`}><Smartphone className="h-4 w-4" strokeWidth={1.5} /></button>
              </div>
            </div>
            <div className="text-xs text-ink/60 mb-2">
              Objet : <strong className="text-ink" data-testid="email-preview-subject">{preview?.subject || '…'}</strong>
            </div>
            <div className="bg-linen/40 border border-linen p-3 flex justify-center overflow-hidden">
              {preview?.html ? (
                <iframe
                  title="Aperçu de l’email"
                  srcDoc={preview.html}
                  sandbox=""
                  data-testid="email-preview-frame"
                  className="bg-white border border-linen transition-all"
                  style={{ width: device === 'mobile' ? 375 : '100%', maxWidth: '100%', height: 560 }}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center text-ink/50">{preview?.error ? 'Aperçu indisponible' : 'Chargement…'}</div>
              )}
            </div>
            <p className="text-[11px] text-ink/50 mt-2">Exemple avec un client fictif et de vraies pièces du catalogue. Rien n’est envoyé.</p>
          </div>

          {/* --- Test --- */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Recevoir un test</div>
            <div className="flex flex-wrap gap-2">
              <input
                type="email" value={to} onChange={(e) => setTo(e.target.value)}
                data-testid="email-test-to"
                className="flex-1 min-w-[220px] h-10 px-3 bg-transparent border border-ink/20 focus:border-ink outline-none"
                placeholder="adresse@exemple.fr"
              />
              <button type="button" onClick={() => sendTest(kind)} disabled={busy || !to} data-testid="email-test-send" className="h-10 px-4 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5 disabled:opacity-50">
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} /> {busy ? 'Envoi…' : 'M’envoyer ce modèle'}
              </button>
            </div>
          </div>

          {/* --- Paniers abandonnés --- */}
          <div data-testid="cart-reminders">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Paniers abandonnés (clients connectés)</div>
              <button type="button" onClick={runReminders} disabled={running} data-testid="run-reminders" className="h-9 px-3 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5 disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${running ? 'animate-spin' : ''}`} strokeWidth={1.5} /> Envoyer les relances dues
              </button>
            </div>
            <p className="text-[11px] text-ink/50 mb-2">Vérification automatique toutes les 15 minutes. Les clients peuvent se désinscrire depuis l’email.</p>
            {carts.length === 0 ? (
              <p className="text-ink/55">Aucun panier en attente.</p>
            ) : (
              <ul className="divide-y divide-linen max-h-72 overflow-auto">
                {carts.map((c) => (
                  <li key={c.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                    <ShoppingBag className="h-3.5 w-3.5 text-ink/40" strokeWidth={1.5} />
                    <span className="flex-1 min-w-[160px] truncate">{c.name ? `${c.name} · ` : ''}{c.email || 'compte supprimé'}</span>
                    <span className="text-ink/60">{c.itemsCount} pièce{c.itemsCount > 1 ? 's' : ''} · {eur(c.subtotal)}</span>
                    <span className="text-ink/50">modifié {fmt(c.updatedAt)}</span>
                    <span className={c.optOut ? 'text-ink/40' : c.reminderCount >= 2 ? 'text-ink/50' : 'text-emerald'}>
                      {c.optOut ? 'désinscrit' : c.reminderCount >= 2 ? '2 relances envoyées' : `${c.reminderCount}/2 · prochaine ${fmt(c.nextReminderAt)}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* --- Historique --- */}
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Derniers emails</div>
            {logs.length === 0 ? (
              <p className="text-ink/55">Aucun email pour le moment.</p>
            ) : (
              <ul className="divide-y divide-linen max-h-72 overflow-auto">
                {logs.map((l) => {
                  const [label, cls] = STATUS[l.status] || [l.status, '']
                  return (
                    <li key={l._id} className="py-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                      <span className="text-ink/50 w-32">{fmt(l.createdAt)}</span>
                      <span className="font-medium w-52">{KIND[l.kind] || l.kind}</span>
                      <span className="flex-1 min-w-[140px] truncate text-ink/70">{Array.isArray(l.to) ? l.to.join(', ') : l.to}</span>
                      <span className={cls}>{label}</span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
