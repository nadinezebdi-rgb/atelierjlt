'use client'

/**
 * PageEditShell — Édition visuelle légère pour les pages secondaires.
 *
 *   - Active uniquement si `?edit=1` dans l'URL ET admin connecté
 *   - Affiche une barre d'outils flottante en haut (identique au mode édition de l'accueil)
 *   - Ouvre un panneau latéral avec tous les champs de la page
 *   - Enregistre dans content.<pageKey> via PATCH /api/admin/site-content
 *
 * Usage :
 *   <PageEditShell
 *     pageKey="about"
 *     initialContent={content}
 *     fields={[
 *       { key: 'heroImage', type: 'image', label: 'Image du hero' },
 *       { key: 'heroTitle', type: 'textarea', label: 'Grand titre' },
 *       ...
 *     ]}
 *     onChange={setContent}
 *   />
 */
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Save, X, Pencil, Check, AlertTriangle, Loader2, Sparkles, Plus, Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function PageEditShell({ pageKey, initialContent, fields, onChange }) {
  const [editMode, setEditMode] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [content, setContent] = useState(initialContent || {})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  // Détecte ?edit=1 + statut admin
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sp = new URLSearchParams(window.location.search)
    if (sp.get('edit') !== '1') return
    fetch('/api/auth/admin-status', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d?.isAdmin) setEditMode(true)
      })
      .catch(() => {})
  }, [])

  const updateField = useCallback((key, value) => {
    setContent((prev) => {
      const next = { ...prev, [key]: value }
      if (onChange) onChange(next)
      return next
    })
    setDirty(true)
  }, [onChange])

  const save = useCallback(async () => {
    setSaving(true)
    setSaveStatus(null)
    try {
      const current = await fetch('/api/admin/site-content', { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => ({}))
      const nextContent = {
        ...(current?.content || {}),
        [pageKey]: content,
      }
      const r = await fetch('/api/admin/site-content', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextContent),
      })
      if (!r.ok) throw new Error('save failed')
      setDirty(false)
      setSaveStatus('ok')
      setTimeout(() => setSaveStatus(null), 2500)
    } catch (e) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 4000)
    } finally {
      setSaving(false)
    }
  }, [content, pageKey])

  const exitEditMode = useCallback(() => {
    if (dirty && !confirm('Modifications non enregistrées. Quitter sans sauvegarder ?')) return
    const url = new URL(window.location.href)
    url.searchParams.delete('edit')
    window.location.href = url.toString()
  }, [dirty])

  if (!editMode || !mounted) return null

  return createPortal(
    <>
      {/* Toolbar sticky en haut */}
      <div
        className="fixed top-0 inset-x-0 z-[200] bg-ink text-ivory shadow-lg"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 h-14 md:h-16">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-emerald flex-none" strokeWidth={1.8} />
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-ivory/90 truncate">
              Mode édition — {pageKey}
            </span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setPanelOpen(true)}
            className="h-11 px-3 md:px-4 text-[11px] uppercase tracking-[0.22em] rounded-sm transition flex items-center gap-2 bg-ivory text-ink"
          >
            <Pencil className="h-4 w-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Modifier</span>
          </button>
          <button
            onClick={save}
            disabled={!dirty || saving}
            className={`h-11 px-4 md:px-5 text-[11px] uppercase tracking-[0.22em] rounded-sm flex items-center gap-2 transition ${
              dirty && !saving
                ? 'bg-emerald text-ivory hover:bg-emerald/90'
                : 'bg-ivory/15 text-ivory/50 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : saveStatus === 'ok' ? (
              <Check className="h-4 w-4" strokeWidth={2} />
            ) : saveStatus === 'error' ? (
              <AlertTriangle className="h-4 w-4" strokeWidth={2} />
            ) : (
              <Save className="h-4 w-4" strokeWidth={1.8} />
            )}
            <span className="hidden sm:inline">
              {saving ? 'Enregistrement…' : saveStatus === 'ok' ? 'Enregistré' : saveStatus === 'error' ? 'Erreur' : 'Enregistrer'}
            </span>
          </button>
          <button
            onClick={exitEditMode}
            className="h-11 w-11 flex items-center justify-center border border-ivory/30 hover:border-ivory rounded-sm"
            aria-label="Quitter le mode édition"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        {dirty && (
          <div className="h-1 bg-emerald/40">
            <div className="h-full bg-emerald w-1/3 animate-pulse" />
          </div>
        )}
      </div>

      {/* Side panel */}
      {panelOpen && (
        <div className="fixed inset-0 z-[250] flex pointer-events-none">
          <button
            onClick={() => setPanelOpen(false)}
            className="flex-1 bg-ink/40 md:bg-transparent pointer-events-auto"
            aria-label="Fermer"
          />
          <aside
            className="w-full md:w-[480px] bg-ivory shadow-2xl pointer-events-auto overflow-y-auto flex flex-col"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
              height: '100dvh',
            }}
          >
            <div className="sticky top-0 bg-ivory z-10 px-5 py-4 border-b border-linen flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Page</div>
                <div className="text-sm text-ink capitalize truncate">{pageKey.replace(/-/g, ' ')}</div>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
                aria-label="Fermer le panneau"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {fields.map((f) => (
                <FieldRenderer
                  key={f.key}
                  field={f}
                  value={content[f.key]}
                  onChange={(v) => updateField(f.key, v)}
                />
              ))}
            </div>

            <div className="mt-auto px-5 py-4 border-t border-linen bg-ivory">
              <button
                onClick={() => setPanelOpen(false)}
                className="w-full h-12 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition rounded-sm"
              >
                Fermer
              </button>
              <p className="text-[10px] text-ink/50 text-center mt-3 uppercase tracking-[0.2em]">
                N'oubliez pas <span className="text-emerald">Enregistrer</span> en haut
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* Padding en haut pour laisser la place à la toolbar */}
      <style jsx global>{`
        body { padding-top: 56px; }
        @media (min-width: 768px) { body { padding-top: 64px; } }
      `}</style>
    </>,
    document.body
  )
}

/* ----------------------------- Field renderer ---------------------------- */

const INPUT_CLS =
  'w-full bg-ivory border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald transition rounded-sm'
const LABEL_CLS = 'block text-[10px] uppercase tracking-[0.26em] text-ink/70 mb-2'

function FieldRenderer({ field, value, onChange }) {
  const { type, label, placeholder, hint } = field

  if (type === 'palette') {
    return (
      <PaletteEditor label={label} value={value || []} onChange={onChange} />
    )
  }
  if (type === 'materials') {
    return (
      <MaterialsEditor label={label} value={value || []} onChange={onChange} />
    )
  }

  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      {type === 'image' && (
        <ImageField value={value || ''} onChange={onChange} placeholder={placeholder} />
      )}
      {(type === 'text' || !type) && (
        <input
          className={INPUT_CLS}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ''}
        />
      )}
      {type === 'textarea' && (
        <textarea
          className={`${INPUT_CLS} min-h-[100px]`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ''}
        />
      )}
      {type === 'longtext' && (
        <textarea
          className={`${INPUT_CLS} min-h-[160px]`}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ''}
        />
      )}
      {hint && <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-[0.22em]">{hint}</p>}
    </label>
  )
}

function ImageField({ value, onChange, placeholder }) {
  const [busy, setBusy] = useState(false)
  const onFile = async (file) => {
    if (!file) return
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
      const d = await r.json()
      if (d.ok && d.url) {
        onChange(d.url)
        toast.success('Image importée')
      } else {
        toast.error(d.error || 'Erreur upload')
      }
    } catch (e) {
      toast.error('Erreur réseau')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      <input
        className={INPUT_CLS}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'https://... ou /api/img/...'}
      />
      <label className="inline-flex items-center gap-2 h-11 px-4 bg-ink text-ivory text-[11px] uppercase tracking-[0.22em] cursor-pointer hover:bg-emerald transition rounded-sm">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <span>Importer depuis l'iPad</span>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
    </div>
  )
}

function PaletteEditor({ label, value, onChange }) {
  const colors = Array.isArray(value) ? value : []
  const update = (i, patch) => {
    const next = colors.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const add = () => onChange([...colors, { name: 'Nouvelle teinte', hex: '#C98498' }])
  const remove = (i) => onChange(colors.filter((_, j) => j !== i))
  return (
    <div>
      <div className={LABEL_CLS}>{label}</div>
      <div className="space-y-2">
        {colors.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={c.hex || '#000000'}
              onChange={(e) => update(i, { hex: e.target.value })}
              className="h-11 w-11 cursor-pointer border border-ink/15 rounded-sm"
            />
            <input
              className={`${INPUT_CLS} flex-1`}
              value={c.name || ''}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Nom de la teinte"
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-brique rounded-sm"
              aria-label="Supprimer"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 h-11 px-4 border border-ink/20 text-[11px] uppercase tracking-[0.22em] hover:border-emerald hover:text-emerald transition rounded-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        Ajouter une teinte
      </button>
    </div>
  )
}

function MaterialsEditor({ label, value, onChange }) {
  const items = Array.isArray(value) ? value : []
  const update = (i, patch) => {
    const next = items.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const add = () => onChange([...items, { name: 'Nouvelle matière', image: '' }])
  const remove = (i) => onChange(items.filter((_, j) => j !== i))

  return (
    <div>
      <div className={LABEL_CLS}>{label}</div>
      <div className="space-y-4">
        {items.map((it, i) => (
          <div key={i} className="border border-linen p-3 rounded-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-ink/60">
                Matière {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="h-9 w-9 flex items-center justify-center border border-ink/15 hover:border-brique rounded-sm"
                aria-label="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
            <input
              className={INPUT_CLS}
              value={it.name || ''}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Nom de la matière"
            />
            <ImageField value={it.image || ''} onChange={(v) => update(i, { image: v })} />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 inline-flex items-center gap-2 h-11 px-4 border border-ink/20 text-[11px] uppercase tracking-[0.22em] hover:border-emerald hover:text-emerald transition rounded-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        Ajouter une matière
      </button>
    </div>
  )
}
