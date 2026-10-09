'use client'

/**
 * Enveloppe cliquable autour du HeroCarousel en mode édition.
 * Fonctionne comme SectionShell mais pour le hero (section virtuelle).
 */
import { Pencil } from 'lucide-react'
import { useEditMode } from './edit-mode-provider'

export default function HeroShell({ children }) {
  const edit = useEditMode()
  if (!edit) return children
  const { selectedId, setSelectedId } = edit
  const isSelected = selectedId === '__hero__'

  return (
    <div className="relative group" data-section-id="__hero__">
      {children}
      <button
        type="button"
        onClick={() => setSelectedId('__hero__')}
        className={`absolute inset-0 w-full h-full outline-none transition
          ${isSelected
            ? 'ring-2 ring-emerald ring-offset-0'
            : 'ring-0 hover:ring-2 hover:ring-emerald/70'}
        `}
        style={{ pointerEvents: 'auto' }}
        aria-label="Modifier le hero"
      >
        <span className="sr-only">Modifier le hero</span>
      </button>
      <span
        className={`pointer-events-none absolute top-2 left-2 md:top-4 md:left-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.22em] bg-ink text-ivory rounded-sm shadow-md transition
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        <Pencil className="h-3 w-3" strokeWidth={1.5} />
        Hero
      </span>
    </div>
  )
}
