'use client'

/**
 * Admin — éditeur d'une page secondaire (À propos, Contact, Collection PE…).
 * Utilise EXACTEMENT les mêmes champs que le mode édition visuel (?edit=1)
 * grâce à la configuration partagée lib/page-content-config.js.
 */
import { useState } from 'react'
import { Eye, Sparkles, ChevronDown } from 'lucide-react'
import { FieldRenderer } from '@/components/edit/page-edit-shell'
import { PAGE_CONFIGS, mergePageContent } from '@/lib/page-content-config'

export default function PageContentEditor({ pageKey, value, onChange, defaultOpen = false }) {
  const cfg = PAGE_CONFIGS[pageKey]
  const [open, setOpen] = useState(defaultOpen)
  if (!cfg) return null
  const content = mergePageContent(pageKey, value)
  const set = (k, v) => onChange({ ...content, [k]: v })

  return (
    <section id={`admin-page-${pageKey}`} className="border border-linen bg-ivory scroll-mt-24" data-testid={`admin-page-${pageKey}`}>
      <div className="flex items-center justify-between flex-wrap gap-3 p-6 md:p-8">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-3 text-left min-h-[44px]">
          <ChevronDown className={`h-4 w-4 text-emerald transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.8} />
          <span>
            <span className="block text-[11px] uppercase tracking-[0.32em] text-emerald">{cfg.label}</span>
            <span className="block text-xs text-ink/55 mt-1">{cfg.fields.length} éléments modifiables — mêmes réglages que l'édition visuelle</span>
          </span>
        </button>
        <div className="flex items-center gap-4">
          <a href={`${cfg.href}?edit=1`} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.24em] text-ink/60 hover:text-emerald flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Édition visuelle
          </a>
          <a href={cfg.href} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.24em] text-ink/60 hover:text-emerald flex items-center gap-1.5">
            <Eye className="h-3 w-3" /> Voir la page
          </a>
        </div>
      </div>
      {open && (
        <div className="border-t border-linen/60 bg-cream/20 p-6 md:p-8 grid md:grid-cols-2 gap-5">
          {cfg.fields.map((f) => (
            <div key={f.key} className={f.type === 'longtext' || f.type === 'image' || f.type === 'palette' || f.type === 'materials' ? 'md:col-span-2' : ''}>
              <FieldRenderer field={f} value={content[f.key]} onChange={(v) => set(f.key, v)} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
