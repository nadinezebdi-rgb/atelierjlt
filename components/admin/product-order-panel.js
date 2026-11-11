'use client'

import { useEffect, useState } from 'react'
import { ArrowUp, ArrowDown, ChevronDown, ListOrdered } from 'lucide-react'
import { toast } from 'sonner'

const COLLECTIONS = [
  { key: 'intemporels', label: 'Les Intemporels' },
  { key: 'pe-2026-2027', label: 'Printemps/Été 2027' },
]

/**
 * Ordre d'affichage des pièces dans chaque collection.
 * Flèches ↑ ↓ (pratiques sur iPad) puis « Enregistrer l'ordre ».
 */
export default function ProductOrderPanel({ products = [], onSaved }) {
  const [open, setOpen] = useState(false)
  const [col, setCol] = useState('intemporels')
  const [list, setList] = useState([])
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setList(products.filter((p) => p.category === col))
    setDirty(false)
  }, [products, col])

  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[i], next[j]] = [next[j], next[i]]
    setList(next)
    setDirty(true)
  }
  const toEdge = (i, top) => {
    const next = [...list]
    const [it] = next.splice(i, 1)
    top ? next.unshift(it) : next.push(it)
    setList(next)
    setDirty(true)
  }

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/products/order', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: col, slugs: list.map((p) => p.slug) }),
    })
    setSaving(false)
    if (r.ok) { toast.success('Ordre enregistré — il est visible sur le site'); setDirty(false); onSaved?.() }
    else toast.error('Enregistrement impossible')
  }

  const switchCol = (k) => {
    if (dirty && !confirm("L'ordre modifié n'est pas enregistré. Changer quand même de collection ?")) return
    setCol(k)
  }

  return (
    <div className="border border-linen bg-ivory mb-6" data-testid="order-panel">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 p-4 text-left" data-testid="order-panel-toggle">
        <span className="flex items-center gap-3">
          <ListOrdered className="h-5 w-5 text-emerald" strokeWidth={1.5} />
          <span>
            <span className="block font-display text-xl">Ordre des pièces</span>
            <span className="block text-xs text-ink/60">Choisissez dans quel ordre les pièces s'affichent dans chaque collection.</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="border-t border-linen p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {COLLECTIONS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => switchCol(c.key)}
                data-testid={`order-col-${c.key}`}
                className={`px-4 py-2 text-[11px] uppercase tracking-[0.2em] border ${col === c.key ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:border-ink'}`}
              >{c.label} ({products.filter((p) => p.category === c.key).length})</button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="text-sm text-ink/60 border border-dashed border-ink/20 p-6 text-center">Aucune pièce dans cette collection pour l'instant.</p>
          ) : (
            <ol className="space-y-1.5">
              {list.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 border border-linen bg-cream/30 p-2" data-testid={`order-row-${p.slug}`}>
                  <span className="w-7 text-center text-sm tabular-nums text-ink/50">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0]} alt="" className="w-12 h-12 object-cover bg-cream" />
                  <span className="flex-1 min-w-0 truncate">{p.name}</span>
                  <button type="button" onClick={() => toEdge(i, true)} disabled={i === 0} className="hidden sm:inline px-2 h-10 text-[10px] uppercase tracking-[0.16em] text-ink/60 hover:text-ink disabled:opacity-25">En premier</button>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" data-testid={`order-up-${p.slug}`} className="h-10 w-10 flex items-center justify-center border border-ink/20 hover:border-ink disabled:opacity-25">
                    <ArrowUp className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Descendre" data-testid={`order-down-${p.slug}`} className="h-10 w-10 flex items-center justify-center border border-ink/20 hover:border-ink disabled:opacity-25">
                    <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </li>
              ))}
            </ol>
          )}

          {list.length > 0 && (
            <div className="flex items-center justify-end gap-3 mt-4">
              {dirty && <span className="text-xs text-terracotta">Ordre modifié, pas encore enregistré</span>}
              <button type="button" onClick={save} disabled={!dirty || saving} data-testid="order-save" className="bg-emerald text-ivory px-5 py-3 text-[11px] uppercase tracking-[0.22em] hover:bg-emeraldDark disabled:opacity-40">
                {saving ? 'Enregistrement…' : "Enregistrer l'ordre"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
