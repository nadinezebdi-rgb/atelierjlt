'use client'

/** Admin → Commandes : état de l'envoi des emails, email de test, historique. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Mail, ChevronDown, Send, CheckCircle2, AlertCircle } from 'lucide-react'

const KIND = {
  order_confirmation: 'Confirmation de commande',
  owner_new_order: 'Nouvelle commande (vous)',
  order_shipped: 'Colis expédié',
  back_in_stock: 'Retour en stock',
  password_reset: 'Mot de passe oublié',
  test: 'Email de test',
  generic: 'Email',
}
const STATUS = {
  sent: ['Envoyé', 'text-emerald'],
  failed: ['Échec', 'text-terracotta'],
  not_configured: ['Non envoyé (envoi inactif)', 'text-ink/50'],
}

export default function EmailsPanel() {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () =>
    fetch('/api/admin/emails', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => { setData(d); setTo((t) => t || d.ownerEmail || '') })
      .catch(() => setData({ configured: false, logs: [] }))
  useEffect(() => { load() }, [])

  const test = async () => {
    setBusy(true)
    const r = await fetch('/api/admin/emails', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to }),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (r.ok) toast.success(`Email de test envoyé à ${to}`)
    else if (d.error === 'not_configured') toast.message('L’envoi des emails n’est pas encore activé')
    else toast.error(d.error === 'send_failed' ? `Échec de l’envoi${d.detail ? ' : ' + d.detail : ''}` : (d.error || 'Erreur'))
    load()
  }

  const logs = data?.logs || []
  return (
    <section className="border border-linen bg-ivory mb-6" data-testid="emails-panel">
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-4 flex flex-wrap items-center gap-3 text-left">
        <Mail className="h-5 w-5 text-emerald" strokeWidth={1.5} />
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-lg">Emails clients</div>
          <div className="text-xs mt-0.5 inline-flex items-center gap-1.5">
            {data?.configured
              ? <><CheckCircle2 className="h-3.5 w-3.5 text-emerald" /> <span className="text-emerald">Envoi actif</span></>
              : <><AlertCircle className="h-3.5 w-3.5 text-terracotta" /> <span className="text-terracotta">Envoi pas encore activé</span></>}
            <span className="text-ink/50">· {logs.length} email{logs.length > 1 ? 's' : ''} récent{logs.length > 1 ? 's' : ''}</span>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="border-t border-linen p-4 space-y-5 text-sm">
          <p className="text-xs text-ink/60 leading-relaxed">
            Envoyés automatiquement : confirmation de commande, alerte « nouvelle commande » à {data?.ownerEmail || 'l’atelier'}, colis expédié avec lien de suivi, retour en stock et mot de passe oublié. Les clients qui répondent écrivent à contact@atelierjlt.fr.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="email" value={to} onChange={(e) => setTo(e.target.value)}
              data-testid="email-test-to"
              className="flex-1 min-w-[220px] h-10 px-3 bg-transparent border border-ink/20 focus:border-ink outline-none"
              placeholder="adresse@exemple.fr"
            />
            <button type="button" onClick={test} disabled={busy || !to} data-testid="email-test-send" className="h-10 px-4 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" strokeWidth={1.5} /> {busy ? 'Envoi…' : 'Envoyer un test'}
            </button>
          </div>
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
                      <span className="text-ink/50 w-32">{new Date(l.createdAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="font-medium w-48">{KIND[l.kind] || l.kind}</span>
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
