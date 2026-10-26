'use client'

/**
 * Admin → Commandes
 *   - liste des commandes avec adresse de livraison et articles
 *   - statut (en français) + numéro de suivi
 *   - impression des bordereaux 10 × 15 cm (étiquette d'envoi + bordereau de retour),
 *     à l'unité ou en lot via la sélection
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Printer, ChevronDown, Package, Undo2 } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

export const ORDER_STATUSES = [
  ['received', 'Reçue'],
  ['preparing', 'En préparation'],
  ['shipped', 'Expédiée'],
  ['delivered', 'Livrée'],
  ['cancelled', 'Annulée'],
]

function openLabels(ids, docs = 'label,return') {
  if (!ids.length) return
  window.open(`/admin/etiquettes?ids=${ids.map(encodeURIComponent).join(',')}&docs=${docs}`, '_blank', 'noopener')
}

export default function TabOrders() {
  const [orders, setOrders] = useState(null)
  const [selected, setSelected] = useState(new Set())
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('todo')

  const load = () =>
    fetch('/api/admin/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]))
  useEffect(() => { load() }, [])

  const patch = async (id, body, msg = 'Commande mise à jour') => {
    const r = await fetch('/api/admin/orders?id=' + encodeURIComponent(id), {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (r.ok) toast.success(msg)
    else toast.error('Erreur')
    load()
  }

  if (!orders) return <div className="text-ink/50">Chargement…</div>

  const visible = orders.filter((o) => {
    if (filter === 'todo') return ['received', 'preparing'].includes(o.status || 'received')
    if (filter === 'shipped') return ['shipped', 'delivered'].includes(o.status)
    return true
  })
  const toggle = (id) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const allVisibleSelected = visible.length > 0 && visible.every((o) => selected.has(o._id))
  const toggleAll = () => {
    const next = new Set(selected)
    if (allVisibleSelected) visible.forEach((o) => next.delete(o._id))
    else visible.forEach((o) => next.add(o._id))
    setSelected(next)
  }
  const selectedIds = orders.filter((o) => selected.has(o._id)).map((o) => o._id)

  return (
    <div data-testid="admin-orders">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="font-display text-3xl">Commandes ({orders.length})</h2>
          <p className="text-sm text-ink/60 mt-2">Imprimez l’étiquette d’envoi (10 × 15 cm) et le bordereau de retour à glisser dans le colis.</p>
        </div>
        <button
          type="button"
          onClick={() => openLabels(selectedIds)}
          disabled={!selectedIds.length}
          data-testid="print-selected"
          className="h-11 px-5 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-emeraldDark disabled:opacity-40"
        >
          <Printer className="h-4 w-4" strokeWidth={1.5} /> Imprimer la sélection ({selectedIds.length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[['todo', 'À expédier'], ['shipped', 'Expédiées'], ['all', 'Toutes']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setFilter(v)} className={`h-10 px-4 text-[11px] uppercase tracking-[0.2em] border transition ${filter === v ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:border-ink'}`}>
            {l}
          </button>
        ))}
        {visible.length > 0 && (
          <label className="ml-auto inline-flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="h-4 w-4 accent-emerald" />
            Tout sélectionner
          </label>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="text-ink/60 border border-linen p-6">Aucune commande ici pour l’instant.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((o) => (
            <OrderRow
              key={o._id}
              order={o}
              selected={selected.has(o._id)}
              onToggle={() => toggle(o._id)}
              open={openId === o._id}
              onOpen={() => setOpenId(openId === o._id ? null : o._id)}
              onPatch={(body, msg) => patch(o._id, body, msg)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderRow({ order: o, selected, onToggle, open, onOpen, onPatch }) {
  const [tracking, setTracking] = useState(o.trackingNumber || '')
  const a = o.address || {}
  const name = a.name || [a.firstName, a.lastName].filter(Boolean).join(' ')
  const count = (o.items || []).reduce((n, i) => n + (i.qty || 1), 0)

  return (
    <div className={`border transition ${selected ? 'border-emerald bg-emerald/5' : 'border-linen bg-ivory'}`} data-testid={`order-${o._id}`}>
      <div className="p-4 flex flex-wrap items-center gap-4">
        <input type="checkbox" checked={selected} onChange={onToggle} className="h-5 w-5 accent-emerald" aria-label={`Sélectionner ${o.orderNumber}`} />
        <button type="button" onClick={onOpen} className="flex-1 min-w-[200px] text-left">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg">{o.orderNumber}</span>
            <ChevronDown className={`h-4 w-4 text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
          </div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50">{new Date(o.createdAt).toLocaleString('fr-FR')}</div>
          <div className="text-sm text-ink/70 mt-1">{name || a.email || 'invité'} · {count} article{count > 1 ? 's' : ''}{a.city ? ` · ${a.city}` : ''}</div>
        </button>
        <div className="font-display text-xl tabular-nums">{formatPrice(o.total)}</div>
        <select
          value={o.status || 'received'}
          onChange={(e) => onPatch({ status: e.target.value, ...(e.target.value === 'shipped' && !o.shippedAt ? { shippedAt: new Date().toISOString() } : {}) }, 'Statut mis à jour')}
          className="h-11 bg-transparent border border-ink/20 px-3 text-[11px] uppercase tracking-[0.18em] focus:outline-none focus:border-ink"
          aria-label="Statut"
        >
          {ORDER_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button
          type="button"
          onClick={() => openLabels([o._id])}
          data-testid={`print-order-${o._id}`}
          className="h-11 px-4 border border-ink/20 hover:border-emerald hover:text-emerald text-[11px] uppercase tracking-[0.18em] inline-flex items-center gap-2"
        >
          <Printer className="h-4 w-4" strokeWidth={1.5} /> Bordereaux
        </button>
      </div>

      {open && (
        <div className="border-t border-linen/70 bg-cream/20 p-5 grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Livraison</div>
            <div className="font-medium">{name || '—'}</div>
            {a.address && <div>{a.address}</div>}
            {(a.apt || a.address2) && <div>{a.apt || a.address2}</div>}
            <div>{[a.zip, a.city].filter(Boolean).join(' ')}</div>
            {a.country && <div>{a.country}</div>}
            {a.phone && <div className="mt-1 text-ink/60">Tél. {a.phone}</div>}
            {a.email && <div className="text-ink/60">{a.email}</div>}
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/50">Envoi {a.shippingMethod === 'express' ? 'Express' : 'Standard'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Articles</div>
            <ul className="space-y-1">
              {(o.items || []).map((it, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{it.name}{it.variant ? ` — ${it.variant}` : ''}{it.size ? ` · ${it.size}` : ''}</span>
                  <span className="tabular-nums text-ink/60">× {it.qty}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Suivi du colis</div>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="N° de suivi (ex. 6A123…)"
              className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm focus:outline-none focus:border-emerald"
            />
            <button
              type="button"
              onClick={() => onPatch({ trackingNumber: tracking.trim(), ...(tracking.trim() && (o.status === 'received' || o.status === 'preparing' || !o.status) ? { status: 'shipped', shippedAt: new Date().toISOString() } : {}) }, 'Suivi enregistré')}
              className="w-full h-11 bg-ink text-ivory text-[11px] uppercase tracking-[0.2em] hover:bg-emerald"
            >
              Enregistrer le suivi
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => openLabels([o._id], 'label')} className="flex-1 h-10 border border-ink/20 hover:border-ink text-[10px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5">
                <Package className="h-3.5 w-3.5" strokeWidth={1.5} /> Étiquette
              </button>
              <button type="button" onClick={() => openLabels([o._id], 'return')} className="flex-1 h-10 border border-ink/20 hover:border-ink text-[10px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Retour
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
