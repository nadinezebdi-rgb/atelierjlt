'use client'

/** Admin → Commandes : livraison en point relais (on/off, prix, code enseigne Mondial Relay). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MapPin } from 'lucide-react'

export default function RelaySettingsPanel() {
  const [s, setS] = useState(null)
  const [price, setPrice] = useState('')
  const [brand, setBrand] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => fetch('/api/admin/shop/shipping', { credentials: 'include' }).then((r) => r.json()).then((d) => {
    setS(d); setPrice(String(d.relayPrice).replace('.', ',')); setBrand((d.mrBrand || '').trim())
  }).catch(() => {})
  useEffect(() => { load() }, [])

  const save = async (patch, msg) => {
    setBusy(true)
    const r = await fetch('/api/admin/shop/shipping', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
    })
    const d = await r.json().catch(() => ({}))
    setBusy(false)
    if (!r.ok) return toast.error(d.error || 'Enregistrement impossible')
    toast.success(msg)
    setS(d); setPrice(String(d.relayPrice).replace('.', ',')); setBrand((d.mrBrand || '').trim())
  }

  if (!s) return null
  const isTest = (s.mrBrand || '').trim() === 'BDTEST'
  return (
    <section className="border border-linen bg-ivory p-4 mb-6" data-testid="relay-settings">
      <div className="flex flex-wrap items-center gap-4">
        <MapPin className="h-5 w-5 text-emerald" strokeWidth={1.5} />
        <div className="flex-1 min-w-[220px]">
          <div className="font-display text-lg">Livraison en point relais</div>
          <p className="text-xs text-ink/65 mt-0.5">
            {s.relayEnabled ? `Proposée au paiement avec la carte Mondial Relay, à ${String(s.relayPrice.toFixed(2)).replace('.', ',')} €.` : 'Désactivée : les clients ne voient que la livraison à domicile et l’express.'}
            {' '}Standard {String(s.standardPrice.toFixed(2)).replace('.', ',')} € · Express {String(s.expressPrice.toFixed(2)).replace('.', ',')} €.
          </p>
        </div>
        <button
          type="button" role="switch" aria-checked={s.relayEnabled} aria-label="Point relais"
          onClick={() => save({ relayEnabled: !s.relayEnabled }, s.relayEnabled ? 'Point relais désactivé' : 'Point relais activé')}
          disabled={busy} data-testid="relay-toggle"
          className={`relative h-7 w-12 rounded-full transition ${s.relayEnabled ? 'bg-emerald' : 'bg-ink/20'} disabled:opacity-50`}
        >
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${s.relayEnabled ? 'left-[22px]' : 'left-0.5'}`} />
        </button>
      </div>
      <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink/55">Prix du point relais (€)</span>
          <div className="flex gap-2 mt-1">
            <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" data-testid="relay-price" className="flex-1 h-10 px-3 bg-transparent border border-ink/20 focus:border-ink outline-none" />
            <button type="button" disabled={busy} onClick={() => save({ relayPrice: price }, 'Prix enregistré')} data-testid="relay-price-save" className="h-10 px-4 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em]">Enregistrer</button>
          </div>
          <div className="flex gap-2 mt-2">
            {['4,90', '5,90'].map((v) => (
              <button key={v} type="button" onClick={() => save({ relayPrice: v }, `Prix : ${v} €`)} className="px-2.5 py-1 border border-ink/15 text-xs hover:border-emerald">{v} €</button>
            ))}
          </div>
        </label>
        <label className="block">
          <span className="text-[10px] uppercase tracking-[0.2em] text-ink/55">Code enseigne Mondial Relay</span>
          <div className="flex gap-2 mt-1">
            <input value={brand} onChange={(e) => setBrand(e.target.value.toUpperCase())} maxLength={8} data-testid="relay-brand" className="flex-1 h-10 px-3 bg-transparent border border-ink/20 focus:border-ink outline-none font-mono" />
            <button type="button" disabled={busy} onClick={() => save({ mrBrand: brand }, 'Code enseigne enregistré')} className="h-10 px-4 border border-ink/20 hover:border-emerald hover:text-emerald text-[10px] uppercase tracking-[0.18em]">Enregistrer</button>
          </div>
          <p className="text-[11px] text-ink/50 mt-1">
            {isTest ? 'Code de test : la carte affiche de vrais relais avec une mention « test ». Remplacez-le par le code fourni par Mondial Relay (ou Boxtal) à l’ouverture de votre compte.' : 'Code fourni par Mondial Relay.'}
          </p>
        </label>
      </div>
    </section>
  )
}
