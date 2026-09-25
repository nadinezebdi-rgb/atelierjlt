'use client'

import { useState, useRef } from 'react'
import { Trash2, Plus, Upload, Loader2, Check, AlertTriangle, Sparkles, Wand2, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Éditeur de variantes de couleur pour un produit.
 * Chaque variante a : nom, couleur hex, stock, prix optionnel, photo dédiée.
 * L'upload de photo utilise /api/admin/upload (persistant MongoDB).
 * Optionnel : vérification Claude Vision → détecte si la couleur photo
 *             correspond au hex de la variante (nécessite backend /api/admin/check-variant-color).
 */
export default function VariantsEditor({ slug, variants, onChange }) {
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
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/50">
          {list.length} variante{list.length > 1 ? 's' : ''} de couleur
        </span>
        <AutoAssignBulk slug={slug} variants={list} onApplied={(next) => onChange(next)} />
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

/* ============ AUTO-ASSIGN BULK ============ */
function AutoAssignBulk({ slug, variants, onApplied }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('idle')      // 'idle' | 'analyzing' | 'preview' | 'applying'
  const [uploads, setUploads] = useState([])
  const fileRef = useRef(null)

  const handleFiles = async (files) => {
    if (!slug) { toast.error('Enregistre d\'abord le produit'); return }
    if (!variants?.length) { toast.error('Ajoute des variantes de couleur d\'abord'); return }
    if (!files || files.length === 0) return
    setStep('analyzing')
    const fd = new FormData()
    fd.append('slug', slug)
    fd.append('apply', 'false')
    for (const f of files) fd.append('files', f)
    try {
      const r = await fetch('/api/admin/auto-assign-variant', { method: 'POST', body: fd, credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Analyse échouée')
      setUploads(d.uploads || [])
      setStep('preview')
    } catch (err) {
      toast.error(err.message)
      setStep('idle')
    }
  }

  const applyAssignments = async () => {
    setStep('applying')
    // Applique côté client sans nouveau upload
    const nextVariants = variants.slice()
    for (const u of uploads) {
      if (u.error || u.variantIndex == null || !u.url) continue
      nextVariants[u.variantIndex] = { ...nextVariants[u.variantIndex], image: u.url }
    }
    onApplied(nextVariants)
    toast.success(`${uploads.filter((u) => u.url).length} photo(s) assignée(s) — clique sur Enregistrer`)
    reset()
  }

  const overrideAssignment = (uploadIdx, variantIdx) => {
    setUploads((u) => u.map((x, i) => i === uploadIdx ? { ...x, variantIndex: variantIdx, variantName: variants[variantIdx]?.name, variantHex: variants[variantIdx]?.hex } : x))
  }

  const removeUpload = (idx) => setUploads((u) => u.filter((_, i) => i !== idx))

  const reset = () => {
    setStep('idle')
    setUploads([])
    setOpen(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); fileRef.current?.click() }}
        disabled={!variants?.length}
        className="inline-flex items-center gap-2 border border-emerald text-emerald px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] hover:bg-emerald hover:text-ivory transition disabled:opacity-40 disabled:cursor-not-allowed"
        title={!variants?.length ? 'Ajoute d\'abord une couleur' : 'Uploader plusieurs photos, Juliette les triera'}
      >
        <Wand2 className="h-3.5 w-3.5" strokeWidth={1.6} />
        Auto-assigner avec l'IA
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {open && step !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4" onClick={reset}>
          <div className="bg-ivory max-w-3xl w-full max-h-[90vh] overflow-auto border border-linen shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-linen flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-emerald" strokeWidth={1.6} /> Auto-assignation par couleur
                </h3>
                <p className="text-[10px] uppercase tracking-[0.22em] text-ink/50 mt-1">
                  Chaque photo est analysée puis assignée à la variante la plus proche
                </p>
              </div>
              <button onClick={reset} className="text-ink/40 hover:text-ink" aria-label="Fermer"><X className="h-5 w-5" /></button>
            </div>

            {step === 'analyzing' && (
              <div className="p-16 text-center text-ink/50">
                <Loader2 className="h-8 w-8 animate-spin text-emerald mx-auto mb-3" />
                <p className="text-sm">Juliette analyse les couleurs…</p>
              </div>
            )}

            {step === 'preview' && (
              <>
                <div className="p-4 text-xs text-ink/60 bg-cream/40 border-b border-linen">
                  {uploads.length} photo{uploads.length > 1 ? 's' : ''} analysée{uploads.length > 1 ? 's' : ''}.
                  Change l'assignation si besoin, puis clique sur « Appliquer » pour affecter chaque image à sa variante.
                </div>
                <div className="p-4 space-y-3">
                  {uploads.map((u, i) => (
                    <UploadRow
                      key={i}
                      upload={u}
                      variants={variants}
                      onChangeVariant={(idx) => overrideAssignment(i, idx)}
                      onRemove={() => removeUpload(i)}
                    />
                  ))}
                </div>
                <div className="p-4 border-t border-linen flex items-center justify-between bg-cream/40">
                  <button onClick={reset} className="text-[11px] uppercase tracking-[0.24em] text-ink/60 hover:text-ink">Annuler</button>
                  <button
                    onClick={applyAssignments}
                    disabled={uploads.length === 0}
                    className="bg-emerald text-ivory px-6 py-2.5 text-[11px] uppercase tracking-[0.24em] hover:bg-emeraldDark transition inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    Appliquer {uploads.filter((u) => u.url && u.variantIndex != null).length} assignation{uploads.filter((u) => u.url && u.variantIndex != null).length > 1 ? 's' : ''}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function UploadRow({ upload: u, variants, onChangeVariant, onRemove }) {
  if (u.error) {
    return (
      <div className="border border-red-300 bg-red-50 p-3 flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <span className="text-xs flex-1">{u.originalName || 'photo'} — <span className="text-red-700">{u.error}</span></span>
        <button onClick={onRemove} className="text-red-600 hover:text-red-800"><X className="h-3.5 w-3.5" /></button>
      </div>
    )
  }
  const goodMatch = u.distance < 30
  const okMatch = u.distance < 50
  return (
    <div className={`border ${goodMatch ? 'border-emerald/40 bg-emerald/5' : okMatch ? 'border-amber-300 bg-amber-50/40' : 'border-red-200 bg-red-50/30'} p-3 flex items-start gap-3`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={u.url} alt={u.originalName} className="w-16 h-16 object-cover border border-ink/10 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs font-medium truncate">{u.originalName || u.filename}</p>
          <span className="text-[9px] uppercase tracking-[0.18em] text-ink/40 shrink-0">
            couleur détectée : {u.dominant}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink/50 shrink-0">Assigner à :</span>
          <select
            value={u.variantIndex ?? ''}
            onChange={(e) => onChangeVariant(Number(e.target.value))}
            className="flex-1 bg-transparent border-b border-ink/20 py-1 text-xs focus:outline-none focus:border-emerald"
          >
            <option value="">— aucune —</option>
            {variants.map((v, i) => (
              <option key={i} value={i}>
                {v.name} ({v.hex}) — {u.variantIndex === i ? `ΔE ${u.distance}` : ''}
              </option>
            ))}
          </select>
          {u.variantHex && (
            <span className="w-5 h-5 rounded-full border border-ink/20" style={{ backgroundColor: u.variantHex }} title={u.variantName} />
          )}
        </div>
        <p className={`text-[10px] mt-1 ${goodMatch ? 'text-emerald' : okMatch ? 'text-amber-700' : 'text-red-600'}`}>
          {goodMatch ? '✓ Correspondance forte' : okMatch ? '~ Correspondance modérée — vérifie' : '⚠ Correspondance faible — envisage une autre variante'}
          {u.confidence === 'low' && ' (photo peu contrastée)'}
        </p>
      </div>
      <button onClick={onRemove} className="text-ink/30 hover:text-red-600 shrink-0" title="Retirer"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

