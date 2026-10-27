'use client'

/** Admin → Éditeur du site → « Menu de navigation » (même éditeur que l'onglet Menu, footer & pages). */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Save } from 'lucide-react'
import { NavbarEditor } from './legal-pages-tab'

export default function NavbarBlock() {
  const [value, setValue] = useState(null)
  const [open, setOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/site-pages/navbar').then((r) => r.json()).then((d) => setValue(d.navbar)).catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    const r = await fetch('/api/admin/site-pages/navbar', {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    })
    setSaving(false)
    const d = await r.json().catch(() => ({}))
    if (r.ok) { setDirty(false); toast.success('Menu enregistré — visible au prochain chargement des pages') }
    else toast.error(d.error || 'Erreur à l’enregistrement')
  }

  return (
    <section id="admin-navbar" className="border border-linen bg-ivory scroll-mt-24" data-testid="admin-navbar-block">
      <div className="flex items-center justify-between flex-wrap gap-3 p-6 md:p-8">
        <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-3 text-left min-h-[44px]">
          <ChevronDown className={`h-4 w-4 text-emerald transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.8} />
          <span>
            <span className="block text-[11px] uppercase tracking-[0.32em] text-emerald">Menu de navigation (barre du haut)</span>
            <span className="block text-xs text-ink/55 mt-1">Liens, ordre, logo, panier, favoris, compte, position, barre fixe…</span>
          </span>
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving || !value}
          data-testid="navbar-block-save"
          className="h-11 px-4 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-emeraldDark disabled:opacity-35"
        >
          <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </button>
      </div>
      {open && value && (
        <div className="border-t border-linen/60 bg-cream/20 p-6 md:p-8">
          <NavbarEditor value={value} onChange={(v) => { setValue(v); setDirty(true) }} />
        </div>
      )}
    </section>
  )
}
