'use client'

/**
 * Admin — Impression des bordereaux d'expédition (format étiquette 10 × 15 cm).
 *
 *   /admin/etiquettes?ids=<id1>,<id2>&docs=label,return
 *
 *   - label  : étiquette d'expédition à coller sur le colis (destinataire + expéditeur)
 *   - return : bordereau de retour à glisser DANS le colis
 *
 * Une page = une étiquette autocollante 10 × 15 cm (@page size 100mm 150mm).
 * L'expéditeur vient de /admin → Réglages → Expédition (par défaut : « Atelier JLT »).
 */
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'

const DEFAULT_SHIPPING = {
  senderName: 'Atelier JLT',
  senderAddress: '',
  senderAddress2: '',
  senderZip: '',
  senderCity: '',
  senderCountry: '',
  senderPhone: '',
  senderEmail: '',
  returnDelayDays: 14,
  returnInstructions:
    "Un article ne vous convient pas ? Cochez-le ci-dessous, indiquez le motif, et glissez ce bordereau dans le colis de retour. Merci de nous écrire avant tout renvoi.",
}

const SHIPPING_METHOD = { standard: 'Standard', express: 'Express' }

export default function LabelsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-10 text-ink/50">Chargement…</div>}>
      <LabelsPage />
    </Suspense>
  )
}

function LabelsPage() {
  const sp = useSearchParams()
  const ids = useMemo(() => (sp.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean), [sp])
  const [docs, setDocs] = useState(() => {
    const d = (sp.get('docs') || 'label,return').split(',')
    return { label: d.includes('label'), return: d.includes('return') }
  })
  const [orders, setOrders] = useState(null)
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const s = await fetch('/api/admin/settings', { credentials: 'include' }).then((r) => r.json()).catch(() => ({}))
        if (alive && s?.settings?.shipping) setShipping({ ...DEFAULT_SHIPPING, ...s.settings.shipping })
        const list = []
        for (const id of ids) {
          const r = await fetch('/api/orders/' + encodeURIComponent(id), { credentials: 'include' })
          if (r.status === 403 || r.status === 401) throw new Error('auth')
          if (!r.ok) continue
          const d = await r.json()
          if (d.order) list.push(d.order)
        }
        if (alive) setOrders(list)
      } catch (e) {
        if (alive) setError(e.message === 'auth' ? 'Connectez-vous à l’administration pour imprimer les bordereaux.' : 'Impossible de charger les commandes.')
      }
    })()
    return () => { alive = false }
  }, [ids])

  const pages = []
  for (const o of orders || []) {
    if (docs.label) pages.push(<ShippingLabel key={o._id + '-label'} order={o} shipping={shipping} />)
    if (docs.return) pages.push(<ReturnSlip key={o._id + '-return'} order={o} shipping={shipping} />)
  }

  return (
    <div className="min-h-screen bg-linen/40">
      <style>{`
        @page { size: 100mm 150mm; margin: 0; }
        @media print {
          html, body { background: #fff !important; }
          body * { visibility: hidden !important; }
          #print-root, #print-root * { visibility: visible !important; }
          #print-root { position: absolute; left: 0; top: 0; padding: 0 !important; gap: 0 !important; }
          .label-sheet { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .label-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* Barre d'outils (non imprimée) */}
      <div className="sticky top-0 z-10 bg-ink text-ivory">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <a href="/admin" className="h-11 px-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] border border-ivory/30 hover:border-ivory">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Admin
          </a>
          <div className="text-[11px] uppercase tracking-[0.24em] text-ivory/80 flex-1 min-w-[160px]">
            Bordereaux 10 × 15 cm · {orders ? `${orders.length} commande${orders.length > 1 ? 's' : ''}` : '…'}
          </div>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={docs.label} onChange={(e) => setDocs({ ...docs, label: e.target.checked })} className="h-4 w-4 accent-emerald" data-testid="doc-label" />
            Étiquette d’envoi
          </label>
          <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={docs.return} onChange={(e) => setDocs({ ...docs, return: e.target.checked })} className="h-4 w-4 accent-emerald" data-testid="doc-return" />
            Bordereau de retour
          </label>
          <button
            onClick={() => window.print()}
            disabled={!pages.length}
            data-testid="print-labels"
            className="h-11 px-5 bg-emerald text-ivory text-[11px] uppercase tracking-[0.22em] inline-flex items-center gap-2 hover:bg-emeraldDark disabled:opacity-40"
          >
            <Printer className="h-4 w-4" strokeWidth={1.5} /> Imprimer
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 text-[11px] text-ivory/60">
          Dans la fenêtre d’impression : choisissez votre imprimante d’étiquettes, format <strong>10 × 15 cm</strong>, marges <strong>aucune</strong>, échelle <strong>100 %</strong>.
        </div>
      </div>

      {error && <div className="max-w-xl mx-auto mt-10 p-6 border border-terracotta/40 bg-ivory text-terracotta text-sm">{error}</div>}
      {!error && !orders && (
        <div className="flex items-center justify-center gap-2 py-20 text-ink/50"><Loader2 className="h-4 w-4 animate-spin" /> Chargement des commandes…</div>
      )}
      {orders && orders.length === 0 && !error && (
        <div className="max-w-xl mx-auto mt-10 p-6 border border-linen bg-ivory text-sm text-ink/70">Aucune commande sélectionnée.</div>
      )}

      <div id="print-root" className="flex flex-wrap justify-center gap-6 p-6">
        {pages}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Sheet({ children, testId }) {
  return (
    <div
      className="label-sheet bg-white text-black shadow-lg overflow-hidden flex flex-col"
      style={{ width: '100mm', height: '150mm', padding: '5mm', boxSizing: 'border-box', fontFamily: 'Arial, Helvetica, sans-serif' }}
      data-testid={testId}
    >
      {children}
    </div>
  )
}

function senderLines(s) {
  return [
    s.senderName || 'Atelier JLT',
    s.senderAddress,
    s.senderAddress2,
    [s.senderZip, s.senderCity].filter(Boolean).join(' '),
    s.senderCountry,
  ].filter(Boolean)
}

function recipient(o) {
  const a = o.address || {}
  const name = a.name || [a.firstName, a.lastName].filter(Boolean).join(' ')
  return {
    name,
    lines: [a.address, a.apt || a.address2, [a.zip, a.city].filter(Boolean).join(' '), (a.country || 'France').toUpperCase()].filter(Boolean),
    phone: a.phone,
    email: a.email,
  }
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('fr-FR') } catch { return '' }
}

function ShippingLabel({ order, shipping }) {
  const r = recipient(order)
  const count = (order.items || []).reduce((n, i) => n + (i.qty || 1), 0)
  return (
    <Sheet testId={`label-${order._id}`}>
      {/* Expéditeur */}
      <div style={{ fontSize: '8pt', lineHeight: 1.3 }}>
        <div style={{ fontSize: '6.5pt', letterSpacing: '0.12em', fontWeight: 700 }}>EXPÉDITEUR</div>
        {senderLines(shipping).map((l, i) => (
          <div key={i} style={i === 0 ? { fontWeight: 700 } : undefined}>{l}</div>
        ))}
        {shipping.senderPhone && <div>Tél. {shipping.senderPhone}</div>}
      </div>

      <div style={{ borderTop: '0.4mm solid #000', margin: '4mm 0' }} />

      {/* Destinataire */}
      <div style={{ flex: 1, border: '0.6mm solid #000', padding: '4mm', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '7pt', letterSpacing: '0.12em', fontWeight: 700, marginBottom: '2mm' }}>DESTINATAIRE</div>
        <div style={{ fontSize: '15pt', fontWeight: 700, lineHeight: 1.2, textTransform: 'uppercase', wordBreak: 'break-word' }}>{r.name || '—'}</div>
        <div style={{ fontSize: '12.5pt', lineHeight: 1.35, marginTop: '2mm', textTransform: 'uppercase', wordBreak: 'break-word' }}>
          {r.lines.map((l, i) => (
            <div key={i} style={i === r.lines.length - 2 ? { fontWeight: 700, fontSize: '14pt' } : undefined}>{l}</div>
          ))}
        </div>
        {r.phone && <div style={{ fontSize: '10pt', marginTop: 'auto', paddingTop: '2mm' }}>Tél. {r.phone}</div>}
      </div>

      {/* Infos commande */}
      <div style={{ marginTop: '4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '3mm' }}>
        <div style={{ fontSize: '7.5pt', lineHeight: 1.4 }}>
          <div>Commande du {fmtDate(order.createdAt)}</div>
          <div>{count} article{count > 1 ? 's' : ''} · {SHIPPING_METHOD[order.address?.shippingMethod] || 'Standard'}</div>
          <div>Poids : ________ kg</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '6.5pt', letterSpacing: '0.12em', fontWeight: 700 }}>N° COMMANDE</div>
          <div style={{ fontSize: '13pt', fontWeight: 700, fontFamily: 'Courier New, monospace', letterSpacing: '0.04em' }}>{order.orderNumber}</div>
        </div>
      </div>
      {order.trackingNumber && (
        <div style={{ marginTop: '2mm', fontSize: '8pt', textAlign: 'right' }}>Suivi : <strong>{order.trackingNumber}</strong></div>
      )}
    </Sheet>
  )
}

function ReturnSlip({ order, shipping }) {
  const r = recipient(order)
  const items = order.items || []
  const MAX = 7
  const shown = items.slice(0, MAX)
  const more = items.length - shown.length
  const box = { display: 'inline-block', width: '3mm', height: '3mm', border: '0.3mm solid #000', marginRight: '1.5mm', verticalAlign: 'middle' }
  const contact = shipping.senderEmail || ''
  return (
    <Sheet testId={`return-${order._id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12pt', fontWeight: 700, letterSpacing: '0.06em' }}>BORDEREAU DE RETOUR</div>
          <div style={{ fontSize: '7.5pt', marginTop: '0.5mm' }}>À glisser dans le colis en cas de retour</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '7.5pt' }}>
          <div style={{ fontWeight: 700 }}>{shipping.senderName || 'Atelier JLT'}</div>
          <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 700 }}>{order.orderNumber}</div>
          <div>{fmtDate(order.createdAt)}</div>
        </div>
      </div>

      <div style={{ borderTop: '0.4mm solid #000', margin: '2.5mm 0' }} />

      <div style={{ fontSize: '8pt', lineHeight: 1.35 }}>
        <strong>Client :</strong> {r.name || '—'}{r.email ? ` · ${r.email}` : ''}
      </div>

      <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.1em', marginTop: '2.5mm' }}>ARTICLE(S) RETOURNÉ(S)</div>
      <div style={{ fontSize: '8pt', lineHeight: 1.3, marginTop: '1mm' }}>
        {shown.map((it, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '0.6mm 0', borderBottom: '0.2mm dotted #999' }}>
            <span style={box} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {it.name}{it.variant ? ` — ${it.variant}` : ''}{it.size ? ` · ${it.size}` : ''}
            </span>
            <span style={{ marginLeft: '2mm', whiteSpace: 'nowrap' }}>× {it.qty || 1}</span>
          </div>
        ))}
        {more > 0 && <div style={{ fontSize: '7pt', marginTop: '0.8mm' }}>+ {more} autre{more > 1 ? 's' : ''} article{more > 1 ? 's' : ''} (voir votre commande)</div>}
      </div>

      <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.1em', marginTop: '2.5mm' }}>MOTIF DU RETOUR</div>
      <div style={{ fontSize: '7.5pt', lineHeight: 1.6, marginTop: '0.8mm', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <div><span style={box} />Dimensions</div>
        <div><span style={box} />Couleur</div>
        <div><span style={box} />Article abîmé</div>
        <div><span style={box} />Erreur de commande</div>
        <div><span style={box} />Changement d’avis</div>
        <div><span style={box} />Autre : ________</div>
      </div>
      <div style={{ fontSize: '7.5pt', lineHeight: 1.6, marginTop: '1mm' }}>
        <span style={box} />Remboursement &nbsp;&nbsp; <span style={box} />Échange
      </div>

      <div style={{ fontSize: '7pt', lineHeight: 1.35, marginTop: '2.5mm', color: '#222' }}>
        {shipping.returnInstructions}
        {shipping.returnDelayDays ? ` Délai de retour : ${shipping.returnDelayDays} jours après réception.` : ''}
        {contact ? ` Contact : ${contact}` : ''}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', gap: '3mm', fontSize: '7.5pt' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '6.5pt', fontWeight: 700, letterSpacing: '0.1em' }}>RETOUR À</div>
          {senderLines(shipping).map((l, i) => (
            <div key={i} style={i === 0 ? { fontWeight: 700 } : undefined}>{l}</div>
          ))}
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div>Date : ___ / ___ / ______</div>
          <div style={{ marginTop: '2mm' }}>Signature :</div>
        </div>
      </div>
    </Sheet>
  )
}
