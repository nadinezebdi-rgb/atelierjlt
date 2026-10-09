'use client'

/**
 * Enveloppe cliquable autour de chaque section de la home en mode édition.
 * - Au survol : outline émeraude discrète + libellé flottant
 * - Au clic/tap : ouvre le panneau d'édition de la section
 * - Les sections désactivées s'affichent en semi-transparent
 */
import { Pencil, EyeOff } from 'lucide-react'
import { useEditMode } from './edit-mode-provider'

export default function SectionShell({ section, children }) {
  const edit = useEditMode()
  if (!edit) return children
  const { selectedId, setSelectedId } = edit
  const isSelected = selectedId === section.id
  const isDisabled = section.enabled === false

  return (
    <div
      className={`relative group transition ${isDisabled ? 'opacity-40' : ''}`}
      data-section-id={section.id}
    >
      {children}
      {/* Overlay cliquable + outline */}
      <button
        type="button"
        onClick={() => setSelectedId(section.id)}
        className={`absolute inset-0 w-full h-full outline-none transition
          ${isSelected
            ? 'ring-2 ring-emerald ring-offset-0'
            : 'ring-0 hover:ring-2 hover:ring-emerald/70'}
        `}
        style={{ pointerEvents: 'auto' }}
        aria-label={`Modifier la section ${section.label || section.id}`}
      >
        <span className="sr-only">Modifier</span>
      </button>
      {/* Pastille flottante en haut à gauche */}
      <span
        className={`pointer-events-none absolute top-2 left-2 md:top-4 md:left-4 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] uppercase tracking-[0.22em] bg-ink text-ivory rounded-sm shadow-md transition
          ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
      >
        {isDisabled ? (
          <>
            <EyeOff className="h-3 w-3" strokeWidth={1.5} />
            Masqué
          </>
        ) : (
          <>
            <Pencil className="h-3 w-3" strokeWidth={1.5} />
            {section.label || section.type}
          </>
        )}
      </span>
    </div>
  )
}
