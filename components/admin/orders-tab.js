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
import { CARRIERS } from '@/lib/tracking'
import EmailsPanel from '@/components/admin/emails-panel'
import SalesSwitch from '@/components/admin/sales-switch'
import RelaySettingsPanel from '@/components/admin/relay-settings-panel'

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
  const [conn, setConn] = useState({})
  useEffect(() => {
    fetch('/api/admin/shipping', { credentials: 'include' }).then((r) => r.json()).then(setConn).catch(() => {})
  }, [])

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
    const d = await r.json().catch(() => ({}))
    if (r.ok) toast.success(msg)
    else toast.error(d.error || 'Erreur')
    if (d.email) {
      if (d.email.ok) toast.success('Email « commande expédiée » envoyé au client')
      else if (d.email.error === 'not_configured') toast.message('Email non envoyé : l’envoi des emails n’est pas encore activé')
      else if (d.email.error === 'no_email') toast.message('Email non envoyé : pas d’adresse email sur la commande')
      else toast.error('L’email au client n’a pas pu partir')
    }
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

      <SalesSwitch />
      <RelaySettingsPanel />
      <EmailsPanel />

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
              conn={conn}
              onReload={load}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OrderRow({ order: o, selected, onToggle, open, onOpen, onPatch, conn = {}, onReload }) {
  const [tracking, setTracking] = useState(o.trackingNumber || '')
  const [carrier, setCarrier] = useState(o.carrier || 'colissimo')
  const [customUrl, setCustomUrl] = useState(o.carrier === 'other' ? (o.trackingUrl || '') : '')
  const [provider, setProvider] = useState(conn.boxtal && !conn.colissimo ? 'boxtal' : 'colissimo')
  const [offer, setOffer] = useState('')
  const [dims, setDims] = useState({ weight: '', length: '30', width: '20', height: '10' })
  const [busy, setBusy] = useState(false)
  const createPaidLabel = async () => {
    setBusy(true)
    try {
      const r = await fetch('/api/admin/shipping', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: o._id, provider, offerCode: offer || undefined, ...dims }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Erreur')
      toast.success('Étiquette affranchie créée')
      if (d.email?.ok) toast.success('Email « commande expédiée » envoyé au client')
      if (d.label?.labelUrl) window.open(d.label.labelUrl, '_blank', 'noopener')
      onReload?.()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }
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
            <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/50">Envoi {a.shippingMethod === 'express' ? 'Express' : a.shippingMethod === 'relay' ? 'Point relais Mondial Relay' : 'Standard'}</div>
            {a.shippingMethod === 'relay' && a.relay && (
              <div className="mt-2 border border-emerald/30 bg-emerald/5 p-2 text-xs" data-testid="order-relay">
                <div className="font-medium">{a.relay.name} <span className="text-ink/50">· n° {a.relay.id}</span></div>
                <div>{a.relay.address}</div>
                <div>{a.relay.zip} {a.relay.city}</div>
              </div>
            )}
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
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm focus:outline-none focus:border-emerald"
              aria-label="Transporteur"
            >
              {CARRIERS.map((c) => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
            <input
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="N° de suivi (ex. 6A123…)"
              data-testid={`tracking-input-${o._id}`}
              className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm focus:outline-none focus:border-emerald"
            />
            {carrier === 'other' && (
              <input
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Lien de suivi (https://…)"
                className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm focus:outline-none focus:border-emerald"
              />
            )}
            <button
              type="button"
              data-testid={`tracking-save-${o._id}`}
              onClick={() => onPatch({
                trackingNumber: tracking.trim(),
                carrier,
                trackingUrl: carrier === 'other' ? customUrl.trim() : (o.carrierLabel?.trackingUrl && o.carrierLabel?.trackingNumber === tracking.trim() ? o.carrierLabel.trackingUrl : ''),
                ...(tracking.trim() && (o.status === 'received' || o.status === 'preparing' || !o.status) ? { status: 'shipped' } : {}),
              }, 'Suivi enregistré')}
              className="w-full h-11 bg-ink text-ivory text-[11px] uppercase tracking-[0.2em] hover:bg-emerald"
            >
              Enregistrer le suivi
            </button>
            <div className="text-[11px] text-ink/55 leading-snug">
              {o.shippedEmailSentAt
                ? <>Email d’expédition envoyé le {new Date(o.shippedEmailSentAt).toLocaleString('fr-FR')} · <button type="button" className="underline hover:text-emerald" onClick={() => onPatch({ resendEmail: true }, 'Renvoi demandé')}>Renvoyer</button></>
                : conn.email ? 'Le client reçoit un email automatiquement au passage en « Expédiée ».' : 'Email automatique : envoi des emails pas encore activé.'}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => openLabels([o._id], 'label')} className="flex-1 h-10 border border-ink/20 hover:border-ink text-[10px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5">
                <Package className="h-3.5 w-3.5" strokeWidth={1.5} /> Étiquette
              </button>
              <button type="button" onClick={() => openLabels([o._id], 'return')} className="flex-1 h-10 border border-ink/20 hover:border-ink text-[10px] uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5">
                <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Retour
              </button>
            </div>
          </div>

          {/* Étiquette affranchie (transporteur) */}
          <div className="md:col-span-3 border-t border-linen pt-5" data-testid={`paid-label-${o._id}`}>
            <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Étiquette affranchie avec suivi</div>
            {o.carrierLabel?.labelUrl || o.carrierLabel?.trackingNumber ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>{o.carrierLabel.provider === 'colissimo' ? 'Colissimo' : 'Boxtal'} · n° {o.carrierLabel.trackingNumber || '—'}</span>
                {o.carrierLabel.labelUrl && (
                  <a href={o.carrierLabel.labelUrl} target="_blank" rel="noopener noreferrer" className="h-10 px-4 inline-flex items-center gap-2 bg-emerald text-ivory text-[11px] uppercase tracking-[0.18em]">
                    <Printer className="h-4 w-4" strokeWidth={1.5} /> Imprimer l’étiquette
                  </a>
                )}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                <label className="block lg:col-span-2">
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-ink/55 mb-1">Transporteur</span>
                  <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm">
                    <option value="colissimo">Colissimo {conn.colissimo ? '' : '(non connecté)'}</option>
                    <option value="boxtal">Boxtal {conn.boxtal ? '' : '(non connecté)'}</option>
                  </select>
                </label>
                {provider === 'boxtal' && (conn.boxtalOffers || []).length > 1 && (
                  <label className="block lg:col-span-2">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-ink/55 mb-1">Offre</span>
                    <select value={offer} onChange={(e) => setOffer(e.target.value)} className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm">
                      {(conn.boxtalOffers || []).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                )}
                {[['weight', 'Poids (kg)'], ['length', 'Long. (cm)'], ['width', 'Larg. (cm)'], ['height', 'Haut. (cm)']].map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-ink/55 mb-1">{l}</span>
                    <input type="number" min="0" step="0.1" value={dims[k]} onChange={(e) => setDims({ ...dims, [k]: e.target.value })} className="w-full bg-ivory border border-ink/15 px-3 h-11 text-sm" />
                  </label>
                ))}
                <button
                  type="button"
                  onClick={createPaidLabel}
                  disabled={busy || !(provider === 'colissimo' ? conn.colissimo : conn.boxtal)}
                  className="h-11 px-4 bg-ink text-ivory text-[11px] uppercase tracking-[0.18em] hover:bg-emerald disabled:opacity-40 lg:col-span-2"
                >
                  {busy ? 'Création…' : 'Créer l’étiquette affranchie'}
                </button>
                {!(provider === 'colissimo' ? conn.colissimo : conn.boxtal) && (
                  <p className="text-[11px] text-terracotta sm:col-span-2 lg:col-span-6">
                    {provider === 'colissimo' ? 'Colissimo' : 'Boxtal'} n’est pas encore connecté : ajoutez vos identifiants pour activer les étiquettes payées. En attendant, utilisez l’étiquette simple ci-dessus.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
