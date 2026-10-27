'use client'

/** Admin → Produits : ruptures de stock + inscriptions « retour en stock ». */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bell, ChevronDown, Send, Trash2, AlertCircle } from 'lucide-react'
import { isSoldOut, lowStockItems } from '@/lib/stock'

export default function StockAlertsPanel({ products = [] }) {
  const [data, setData] = useState(null)
  const [open, setOpen] = useState(false)
  // S'ouvre tout seul s'il y a du stock faible ou des ruptures
  useEffect(() => { if (products.some((p) => isSoldOut(p) || lowStockItems(p).length)) setOpen(true) }, [products.length])
  const load = () =>
    fetch('/api/admin/stock-alerts', { credentials: 'include' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ alerts: [], summary: [] }))
  useEffect(() => { load() }, [])

  const soldOut = products.filter((p) => isSoldOut(p))
  const lowVariants = products.flatMap((p) =>
    (p.variants || []).filter((v) => Number(v.stock || 0) === 0).map((v) => ({ p, v }))
  ).filter(({ p }) => !isSoldOut(p))
  const alerts = data?.alerts || []
  const low = products.flatMap((p) => lowStockItems(p).map((it) => ({ p, it })))

  const notify = async (slug) => {
    const r = await fetch(`/api/admin/stock-alerts/notify?slug=${encodeURIComponent(slug)}`, { method: 'POST', credentials: 'include' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) return toast.error(d.error || 'Erreur')
    if (!d.configured) toast.message('Envoi des emails pas encore activé : les alertes restent en attente')
    else if (d.sent) toast.success(`${d.sent} email${d.sent > 1 ? 's' : ''} envoyé${d.sent > 1 ? 's' : ''}`)
    else toast.message('Aucun article de nouveau disponible pour ces inscriptions')
    load()
  }
  const remove = async (id) => {
    await fetch(`/api/admin/stock-alerts?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
    load()
  }

  return (
    <section className="border border-linen bg-ivory mt-8" data-testid="stock-alerts-panel">
      <button type="button" onClick={() => setOpen(!open)} className="w-full p-5 flex flex-wrap items-center gap-4 text-left">
        <Bell className="h-5 w-5 text-emerald" strokeWidth={1.5} />
        <div className="flex-1 min-w-[200px]">
          <div className="font-display text-lg">Stock : ruptures, stock faible & alertes</div>
          <div className="text-xs text-ink/55 mt-0.5">
            {soldOut.length} produit{soldOut.length > 1 ? 's' : ''} épuisé{soldOut.length > 1 ? 's' : ''} · {lowVariants.length} couleur{lowVariants.length > 1 ? 's' : ''} épuisée{lowVariants.length > 1 ? 's' : ''} · <span className={low.length ? 'text-terracotta font-medium' : ''}>{low.length} en stock faible</span> · {alerts.length} client{alerts.length > 1 ? 's' : ''} en attente
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="border-t border-linen p-5 space-y-6 text-sm">
          <p className="text-xs text-ink/60 leading-relaxed">
            Quand vous remettez du stock sur un produit (ou une couleur), les clients inscrits sont prévenus automatiquement par email à l’enregistrement.
            {data && !data.emailConfigured && (
              <span className="block mt-1 text-terracotta inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> Envoi des emails pas encore activé : les inscriptions sont gardées et partiront dès la connexion.</span>
            )}
          </p>

          <div data-testid="low-stock-list">
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Stock faible (1 ou 2 pièces)</div>
            {low.length === 0 ? (
              <p className="text-ink/55">Rien à signaler.</p>
            ) : (
              <ul className="space-y-1">
                {low.map(({ p, it }) => (
                  <li key={p.slug + it.kind + it.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-terracotta flex-none" />
                    <span><strong className="font-medium">{p.name}</strong>{it.kind !== 'Produit' ? <> — {it.kind.toLowerCase()} <em>{it.name}</em></> : null} : plus que <strong>{it.stock}</strong> pièce{it.stock > 1 ? 's' : ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Épuisés</div>
            {soldOut.length === 0 && lowVariants.length === 0 ? (
              <p className="text-ink/55">Aucune rupture pour le moment.</p>
            ) : (
              <ul className="space-y-1">
                {soldOut.map((p) => <li key={p.slug}>• <strong className="font-medium">{p.name}</strong> — tout est épuisé</li>)}
                {lowVariants.map(({ p, v }) => <li key={p.slug + v.name}>• {p.name} — couleur <em>{v.name}</em> épuisée</li>)}
              </ul>
            )}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Clients en attente</div>
            {(data?.summary || []).length === 0 ? (
              <p className="text-ink/55">Personne n’attend de retour en stock.</p>
            ) : (
              <div className="space-y-4">
                {data.summary.map((s) => (
                  <div key={s.slug} className="border border-linen p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex-1 font-medium">{s.name} <span className="text-ink/50 font-normal">· {s.count} inscrit{s.count > 1 ? 's' : ''}</span></span>
                      <button type="button" onClick={() => notify(s.slug)} className="h-10 px-3 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em] inline-flex items-center gap-1.5">
                        <Send className="h-3.5 w-3.5" strokeWidth={1.5} /> Prévenir maintenant
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {alerts.filter((a) => a.slug === s.slug).map((a) => (
                        <li key={a._id} className="flex items-center gap-2 text-xs text-ink/70">
                          <span className="flex-1 truncate">{a.email}{a.variant ? ` — ${a.variant}` : ''}{a.size ? ` · ${a.size}` : ''} · {new Date(a.createdAt).toLocaleDateString('fr-FR')}</span>
                          <button type="button" onClick={() => remove(a._id)} aria-label="Supprimer l’inscription" className="h-8 w-8 flex items-center justify-center text-terracotta hover:bg-terracotta/10"><Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /></button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
