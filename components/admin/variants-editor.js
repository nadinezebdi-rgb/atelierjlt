'use client'

import { useState, useRef } from 'react'
import { Trash2, Plus, Upload, Loader2, Check, AlertTriangle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Éditeur de variantes de couleur pour un produit.
 * Chaque variante a : nom, couleur hex, stock, prix optionnel, photo dédiée.
 * L'upload de photo utilise /api/admin/upload (persistant MongoDB).
 * Optionnel : vérification Claude Vision → détecte si la couleur photo
 *             correspond au hex de la variante (nécessite backend /api/admin/check-variant-color).
 */
export default function VariantsEditor({ variants, onChange }) {
  const list = variants || []

  const set = (i, k, v) => {
    const next = list.slice()
    next[i] = { ...next[i], [k]: v }
    onChange(next)
  }
  const add = () => {
    const template = { name: 'Nouvelle couleur', hex: '#8B8681', stock: 0, image: '', isDefault: list.length === 0 }
    onChange([...list, template])
  }
  const remove = (i) => {
    const next = list.slice()
    next.splice(i, 1)
    if (next.length && !next.some((v) => v.isDefault)) next[0].isDefault = true
    onChange(next)
  }
  const setDefault = (i) => {
    onChange(list.map((v, k) => ({ ...v, isDefault: k === i })))
  }

  if (list.length === 0) {
    return (
      <div className="mt-1 border border-dashed border-ink/20 p-4 text-center">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50 mb-3">
          Aucune variante — le produit n'est disponible qu'en une couleur
        </p>
        <button
          type="button"
          onClick={add}
          className="text-[11px] uppercase tracking-[0.22em] px-4 py-2 border border-ink/30 hover:border-emerald hover:text-emerald transition"
        >
          + Ajouter une couleur
        </button>
      </div>
    )
  }

  return (
    <div className="mt-1 space-y-3">
      <div className="text-[10px] uppercase tracking-[0.22em] text-ink/50 mb-1">
        {list.length} variante{list.length > 1 ? 's' : ''} de couleur
      </div>
      {list.map((v, i) => (
        <VariantRow
          key={i}
          v={v}
          index={i}
          onChangeField={(k, val) => set(i, k, val)}
          onRemove={() => remove(i)}
          onSetDefault={() => setDefault(i)}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] px-4 py-2 border border-dashed border-emerald text-emerald hover:bg-emerald hover:text-ivory transition"
      >
        <Plus className="h-3 w-3" /> Ajouter une couleur
      </button>
    </div>
  )
}

/* ============ LIGNE VARIANTE ============ */
function VariantRow({ v, index, onChangeField, onRemove, onSetDefault }) {
  const [uploading, setUploading] = useState(false)
  const [colorCheck, setColorCheck] = useState(null)   // {ok, match, dominant, message}
  const [checking, setChecking] = useState(false)
  const fileRef = useRef(null)

  const upload = async (file) => {
    if (!file) return
    setUploading(true)
    setColorCheck(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Upload échoué')
      onChangeField('image', d.url)
      toast.success(`Photo assignée à « ${v.name} »`)
      // Vérification couleur automatique
      if (v.hex && d.url) checkColor(d.url)
    } catch (err) {
      toast.error(err.message || 'Échec')
    } finally {
      setUploading(false)
    }
  }

  const checkColor = async (url) => {
    if (!v.hex) return
    setChecking(true)
    try {
      const r = await fetch('/api/admin/check-variant-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url || v.image, targetHex: v.hex }),
      })
      const d = await r.json()
      if (r.ok) setColorCheck(d)
    } catch { /* silent */ } finally { setChecking(false) }
  }

  return (
    <div className="border border-linen bg-ivory p-3">
      <div className="grid grid-cols-1 md:grid-cols-[90px_1fr_140px_100px_80px_90px_40px] gap-3 items-start">
        {/* Aperçu photo */}
        <div className="relative">
          <div
            className={`w-20 h-20 border ${v.image ? 'border-ink/10' : 'border-dashed border-amber-400 bg-amber-50/40'} overflow-hidden flex items-center justify-center cursor-pointer group`}
            onClick={() => fileRef.current?.click()}
          >
            {v.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.image} alt={v.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.opacity = 0.15 }} />
            ) : (
              <div className="flex flex-col items-center gap-1 text-amber-600">
                <Upload className="h-4 w-4" />
                <span className="text-[9px] uppercase tracking-[0.18em]">Photo</span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-ivory/80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-emerald" />
              </div>
            )}
            {!uploading && (
              <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-ivory text-[9px] uppercase tracking-[0.18em]">
                Remplacer
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
        </div>
        {/* Nom + hex + swatch */}
        <div>
          <input
            value={v.name || ''}
            onChange={(e) => onChangeField('name', e.target.value)}
            placeholder="Bordeaux"
            className="w-full bg-transparent border-b border-ink/15 py-1.5 text-sm focus:outline-none focus:border-ink"
          />
          <div className="flex items-center gap-2 mt-2">
            <label className="relative w-6 h-6 rounded-full border border-ink/20 overflow-hidden cursor-pointer" style={{ backgroundColor: v.hex || '#000' }}>
              <input
                type="color"
                value={v.hex || '#000000'}
                onChange={(e) => onChangeField('hex', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
            <input
              value={v.hex || ''}
              onChange={(e) => onChangeField('hex', e.target.value)}
              placeholder="#5B1E1A"
              className="flex-1 bg-transparent border-b border-ink/15 py-1 text-xs font-mono focus:outline-none focus:border-ink"
            />
          </div>
        </div>
        {/* URL image + bouton check */}
        <div className="text-[10px]">
          <div className="text-ink/50 uppercase tracking-[0.18em] mb-1">URL photo</div>
          <div className="font-mono text-[10px] text-ink/70 truncate" title={v.image}>{v.image || '—'}</div>
          {v.image && v.hex && (
            <button
              type="button"
              onClick={() => checkColor()}
              disabled={checking}
              className="mt-1.5 inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.18em] px-2 py-1 border border-emerald text-emerald hover:bg-emerald hover:text-ivory transition disabled:opacity-50"
            >
              {checking ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />}
              Vérifier couleur
            </button>
          )}
          {colorCheck && <ColorCheckBadge check={colorCheck} />}
        </div>
        {/* Prix */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.18em] text-ink/50">Prix override</label>
          <input
            type="number"
            value={v.price ?? ''}
            onChange={(e) => onChangeField('price', e.target.value === '' ? null : Number(e.target.value))}
            placeholder="—"
            className="w-full bg-transparent border-b border-ink/15 py-1.5 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
        </div>
        {/* Stock */}
        <div>
          <label className="text-[9px] uppercase tracking-[0.18em] text-ink/50">Stock</label>
          <input
            type="number"
            value={v.stock ?? 0}
            onChange={(e) => onChangeField('stock', Number(e.target.value))}
            className="w-full bg-transparent border-b border-ink/15 py-1.5 text-sm tabular-nums focus:outline-none focus:border-ink"
          />
        </div>
        {/* Défaut */}
        <label className="flex items-center gap-2 text-[10px] cursor-pointer pt-4">
          <input
            type="radio"
            name="variant-default"
            checked={!!v.isDefault}
            onChange={onSetDefault}
          />
          <span className="text-ink/60">défaut</span>
        </label>
        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="text-ink/40 hover:text-red-600 pt-4"
          aria-label="Supprimer la variante"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

function ColorCheckBadge({ check }) {
  if (!check) return null
  const match = check.match
  return (
    <div className={`mt-2 flex items-start gap-1.5 text-[10px] p-1.5 border ${match ? 'border-emerald/40 bg-emerald/5 text-emerald' : 'border-amber-400 bg-amber-50 text-amber-700'}`}>
      {match ? <Check className="h-3 w-3 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
      <span className="leading-tight">{check.message}</span>
    </div>
  )
}
