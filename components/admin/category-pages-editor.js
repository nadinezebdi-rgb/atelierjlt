'use client'

/** Admin → Éditeur du site → Pages Collections : titre, sur-titre et sous-titre de chaque catégorie. */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Eye, Save, RotateCcw } from 'lucide-react'

const INPUT = 'w-full bg-ivory border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald rounded-sm'
const LABEL = 'block text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-2'

export default function CategoryPagesEditor() {
  const [cats, setCats] = useState(null)
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/site-pages/categories').then((r) => r.json()).then((d) => setCats(d.categories || [])).catch(() => setCats([]))
  }, [])

  const upd = (slug, patch) => {
    setCats((list) => list.map((c) => (c.slug === slug ? { ...c, ...patch } : c)))
    setDirty(true)
  }
  const save = async () => {
    setSaving(true)
    const items = Object.fromEntries(cats.map((c) => [c.slug, { name: c.name, tagline: c.tagline, eyebrow: c.eyebrow }]))
    const r = await fetch('/api/admin/site-pages/categories', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    setSaving(false)
    if (r.ok) { setDirty(false); toast.success('Pages Collections enregistrées') } else toast.error('Erreur à l’enregistrement')
  }

  return (
    <section id="admin-category-pages" className="border border-linen bg-ivory scroll-mt-24" data-testid="admin-category-pages">
      <div className="flex items-center justify-between flex-wrap gap-3 p-6 md:p-8">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left min-h-[44px]">
          <ChevronDown className={`h-4 w-4 text-emerald transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.8} />
          <span>
            <span className="block text-[11px] uppercase tracking-[0.32em] text-emerald">Pages Collections</span>
            <span className="block text-xs text-ink/55 mt-1">Titre et sous-titre de chaque catégorie (Éditions limitées, Nouveautés, Intemporels…)</span>
          </span>
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          data-testid="category-pages-save"
          className="h-11 px-4 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-emeraldDark disabled:opacity-35"
        >
          <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </button>
      </div>
      {open && (
        <div className="border-t border-linen/60 bg-cream/20 p-6 md:p-8 space-y-4">
          {!cats ? <div className="text-ink/50 text-sm">Chargement…</div> : cats.map((c) => (
            <div key={c.slug} className="border border-linen bg-ivory p-4" data-testid={`category-${c.slug}`}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="font-display text-lg">{c.name || c.defaultName}</div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => upd(c.slug, { name: c.defaultName, tagline: c.defaultTagline, eyebrow: 'Produits' })} className="text-[10px] uppercase tracking-[0.2em] text-ink/50 hover:text-ink inline-flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" /> D’origine
                  </button>
                  <a href={`/produits?cat=${c.slug}`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.22em] text-ink/60 hover:text-emerald inline-flex items-center gap-1.5">
                    <Eye className="h-3 w-3" /> Voir
                  </a>
                </div>
              </div>
              <div className="grid md:grid-cols-[1fr_2fr] gap-4">
                <label className="block"><span className={LABEL}>Petit texte au-dessus</span><input value={c.eyebrow ?? ''} onChange={(e) => upd(c.slug, { eyebrow: e.target.value })} className={INPUT} placeholder="Produits" /></label>
                <label className="block"><span className={LABEL}>Titre (aussi utilisé dans les onglets de filtre)</span><input value={c.name || ''} onChange={(e) => upd(c.slug, { name: e.target.value })} className={INPUT} data-testid={`category-name-${c.slug}`} /></label>
                <label className="block md:col-span-2"><span className={LABEL}>Sous-titre</span><textarea rows={2} value={c.tagline || ''} onChange={(e) => upd(c.slug, { tagline: e.target.value })} className={INPUT} data-testid={`category-tagline-${c.slug}`} /></label>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
