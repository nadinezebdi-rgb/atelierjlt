'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { AlertTriangle, Image as ImageIcon, Upload, Check, Loader2, X, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Outil de récupération des photos manquantes après un redéploiement.
 * Liste chaque produit ayant des URLs 404 et propose de re-uploader la photo
 * (drag-drop, jimp compression côté serveur, remplacement automatique).
 */
export default function MissingMediaRecovery() {
  const [state, setState] = useState({ loading: true, products: [], summary: null })
  const [uploading, setUploading] = useState({})   // slug:slot → true

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }))
    try {
      const r = await fetch('/api/admin/broken-media', { cache: 'no-store', credentials: 'include' })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'load failed')
      setState({ loading: false, products: d.products || [], summary: d.summary || null })
    } catch (e) {
      setState({ loading: false, products: [], summary: null })
      console.warn('missing-media load failed', e)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleFile = async (slug, slot, file) => {
    if (!file) return
    const key = `${slug}:${slot}`
    setUploading((u) => ({ ...u, [key]: true }))
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('slug', slug)
      fd.append('slot', slot)
      const r = await fetch('/api/admin/broken-media', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Échec upload')
      toast.success(`Photo remise en place : ${slug}`)
      // Retire l'item réparé de l'affichage
      setState((s) => ({
        ...s,
        products: s.products
          .map((p) => p.slug === slug ? { ...p, broken: p.broken.filter((b) => b.slot !== slot) } : p)
          .filter((p) => p.broken.length > 0),
        summary: s.summary ? { ...s.summary, totalMissing: Math.max(0, s.summary.totalMissing - 1) } : null,
      }))
    } catch (err) {
      toast.error(err.message || 'Échec')
    } finally {
      setUploading((u) => { const n = { ...u }; delete n[key]; return n })
    }
  }

  if (state.loading) {
    return (
      <div className="border border-linen bg-ivory p-8 flex items-center justify-center text-ink/50">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Analyse des médias en cours…
      </div>
    )
  }

  const { products, summary } = state
  const totalMissing = summary?.totalMissing || 0

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8 space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <Zap className="h-4 w-4" strokeWidth={1.6} /> Récupération des photos manquantes
          </h3>
          <p className="text-xs text-ink/60 mt-2 max-w-2xl">
            Après un redéploiement, certaines photos uploadées via l'admin peuvent avoir été perdues.
            Cette page liste chaque emplacement vide et te permet de re-uploader la bonne photo en un clic.
            <strong className="text-ink"> À partir de maintenant, tous les uploads sont stockés dans MongoDB</strong> —
            ils survivront désormais aux futurs déploiements.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 border border-ink/20 px-3 py-2 text-[10px] uppercase tracking-[0.24em] text-ink hover:bg-ink hover:text-ivory transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recharger
        </button>
      </header>

      {totalMissing === 0 ? (
        <div className="border border-emerald/30 bg-emerald/5 p-6 text-center">
          <Check className="h-8 w-8 text-emerald mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-sm text-emerald font-medium">Aucune photo manquante — tout est en place !</p>
        </div>
      ) : (
        <>
          <div className="border border-amber-300 bg-amber-50 p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" strokeWidth={1.6} />
            <div className="text-xs">
              <strong className="text-amber-800">{totalMissing} photo{totalMissing > 1 ? 's' : ''} manquante{totalMissing > 1 ? 's' : ''}</strong>
              <span className="text-ink/60"> réparties sur {summary.productsWithMissing} produit{summary.productsWithMissing > 1 ? 's' : ''}. Uploade la bonne photo dans chaque zone ci-dessous.</span>
            </div>
          </div>

          <div className="space-y-4">
            {products.map((p) => (
              <ProductBrokenCard
                key={p.slug}
                product={p}
                onUpload={handleFile}
                uploading={uploading}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function ProductBrokenCard({ product, onUpload, uploading }) {
  return (
    <div className="border border-linen bg-cream/20 p-4">
      <div className="flex items-baseline justify-between gap-4 mb-3 flex-wrap">
        <h4 className="text-sm font-medium">{product.name}</h4>
        <span className="text-[10px] uppercase tracking-[0.22em] text-amber-700">
          {product.broken.length} photo{product.broken.length > 1 ? 's' : ''} manquante{product.broken.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {product.broken.map((b) => {
          const key = `${product.slug}:${b.slot}`
          const busy = !!uploading[key]
          return (
            <DropZone
              key={b.slot}
              label={slotLabel(b.slot, b.label)}
              busy={busy}
              onFile={(file) => onUpload(product.slug, b.slot, file)}
              filename={b.filename}
            />
          )
        })}
      </div>
    </div>
  )
}

function DropZone({ label, busy, onFile, filename }) {
  const ref = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handle = (files) => {
    if (!files || files.length === 0) return
    onFile(files[0])
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files) }}
      className={`relative border-2 border-dashed p-3 flex flex-col items-center justify-center min-h-[130px] cursor-pointer transition ${
        dragOver ? 'border-emerald bg-emerald/5' : busy ? 'border-emerald bg-ivory' : 'border-amber-400 bg-ivory hover:border-emerald hover:bg-emerald/5'
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,video/mp4,application/pdf"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
        disabled={busy}
      />
      {busy ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-emerald mb-1" />
          <span className="text-[10px] uppercase tracking-[0.22em] text-emerald">Upload…</span>
        </>
      ) : (
        <>
          <ImageIcon className="h-5 w-5 text-amber-500 mb-1" strokeWidth={1.4} />
          <span className="text-[10px] uppercase tracking-[0.22em] text-ink/70 text-center">{label}</span>
          <span className="text-[9px] text-ink/40 mt-1 flex items-center gap-1">
            <Upload className="h-2.5 w-2.5" /> Glisse une photo
          </span>
          <span className="text-[8px] text-ink/30 mt-0.5 font-mono truncate max-w-full">{filename}</span>
        </>
      )}
    </label>
  )
}

function slotLabel(slot, extra) {
  const [type, arg] = slot.split(':')
  if (type === 'images') return `Photo #${Number(arg) + 1}`
  if (type === 'variant') return `Variante ${extra || arg}`
  if (type === 'size') return `Taille ${extra || arg}`
  return slot
}
