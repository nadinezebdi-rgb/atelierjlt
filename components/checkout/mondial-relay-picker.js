'use client'

/** Carte Mondial Relay (widget officiel « Parcelshop Picker ») pour choisir son point relais. */
import { useEffect, useRef, useState } from 'react'
import { MapPin, Check } from 'lucide-react'

const JQUERY = 'https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const WIDGET = 'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)?.dataset.loaded) return resolve()
    let s = document.querySelector(`script[data-src="${src}"]`)
    if (!s) {
      s = document.createElement('script')
      s.src = src; s.async = false; s.dataset.src = src
      document.head.appendChild(s)
    }
    s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve() })
    s.addEventListener('error', reject)
  })
}
let loading = null
function loadWidget() {
  if (!loading) {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = LEAFLET_CSS; document.head.appendChild(l)
    }
    loading = loadScript(JQUERY).then(() => loadScript(LEAFLET_JS)).then(() => loadScript(WIDGET))
    loading.catch(() => { loading = null })
  }
  return loading
}

export default function MondialRelayPicker({ brand = 'BDTEST  ', postCode = '', value, onChange }) {
  const box = useRef(null)
  const [state, setState] = useState('loading') // loading | ready | error
  const cb = useRef(onChange)
  cb.current = onChange
  const zip = /^\d{5}$/.test(String(postCode).trim()) ? String(postCode).trim() : ''

  useEffect(() => {
    let cancelled = false
    loadWidget().then(() => {
      if (cancelled || !box.current || !window.jQuery?.fn?.MR_ParcelShopPicker) { if (!cancelled) setState('error'); return }
      const $ = window.jQuery
      const el = $(box.current)
      el.empty()
      el.MR_ParcelShopPicker({
        Target: '#mr-parcelshop-id',
        Brand: brand,
        Country: 'FR',
        PostCode: zip,
        NbResults: '7',
        ColLivMod: '24R',
        Responsive: true,
        ShowResultsOnMap: true,
        OnParcelShopSelected: (d) => {
          cb.current?.({
            id: d.ID, name: d.Nom, address: [d.Adresse1, d.Adresse2].filter(Boolean).join(', '),
            zip: d.CP, city: d.Ville, country: d.Pays || 'FR',
          })
        },
      })
      setState('ready')
    }).catch(() => !cancelled && setState('error'))
    return () => { cancelled = true }
  }, [brand, zip])

  return (
    <div className="mt-4 border border-linen bg-white p-3" data-testid="relay-picker">
      {state === 'loading' && <p className="text-sm text-ink/50 p-4">Chargement de la carte des points relais…</p>}
      {state === 'error' && <p className="text-sm text-terracotta p-4">La carte des points relais n’a pas pu se charger. Vérifiez votre connexion ou choisissez la livraison à domicile.</p>}
      <div ref={box} className="min-h-[420px] [&_*]:max-w-full" />
      <input id="mr-parcelshop-id" type="hidden" />
      {value ? (
        <div className="mt-3 border border-emerald/40 bg-emerald/5 p-3 text-sm flex gap-2" data-testid="relay-selected">
          <Check className="h-4 w-4 text-emerald mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">{value.name}</div>
            <div className="text-ink/65">{value.address} · {value.zip} {value.city}</div>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs text-ink/55 inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Choisissez un point relais sur la carte ou dans la liste.</p>
      )}
    </div>
  )
}
