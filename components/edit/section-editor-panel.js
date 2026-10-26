'use client'

/**
 * Panneau latéral d'édition d'une section (mode édition visuel /?edit=1).
 *   - Mobile/iPad : plein écran, slide depuis la droite
 *   - Desktop : panneau 440px flottant à droite
 *
 * Les champs eux-mêmes sont dans ./section-fields.js — partagés avec l'admin
 * (/admin → Éditeur de l'accueil) pour offrir exactement les mêmes fonctions.
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, EyeOff, Trash2 } from 'lucide-react'
import SectionFields from './section-fields'

export default function SectionEditorPanel({ section, onClose, onChange, onToggle, onRemove }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted || typeof document === 'undefined') return null

  const updateContent = (patch) => onChange({ content: patch })

  return createPortal(
    <div className="fixed inset-0 z-[250] flex pointer-events-none">
      {/* Backdrop (seulement mobile) */}
      <button
        onClick={onClose}
        className="flex-1 bg-ink/40 md:bg-transparent pointer-events-auto"
        aria-label="Fermer"
      />
      <aside
        className="w-full md:w-[440px] bg-ivory shadow-2xl pointer-events-auto overflow-y-auto flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: '100dvh',
        }}
        data-testid="section-editor-panel"
      >
        {/* Header */}
        <div className="sticky top-0 bg-ivory z-10 px-5 py-4 border-b border-linen flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Section</div>
            <div className="text-sm text-ink truncate">{section.label || section.id}</div>
          </div>
          <div className="flex items-center gap-2">
            {section.type !== 'hero' && (
              <button
                onClick={onToggle}
                className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
                aria-label={section.enabled !== false ? 'Masquer la section' : 'Afficher la section'}
                title={section.enabled !== false ? 'Cliquez pour masquer' : 'Cliquez pour afficher'}
              >
                {section.enabled !== false ? (
                  <Eye className="h-4 w-4 text-emerald" strokeWidth={1.5} />
                ) : (
                  <EyeOff className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
              aria-label="Fermer le panneau"
            >
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        </div>

        {/* Fields (partagés avec l'admin) */}
        <div className="p-5">
          <SectionFields section={section} updateContent={updateContent} />
        </div>

        {/* Footer actions */}
        <div className="mt-auto px-5 py-4 border-t border-linen bg-ivory">
          {onRemove && (
            <button
              onClick={() => {
                if (confirm('Supprimer cette section définitivement ?')) {
                  onRemove()
                }
              }}
              className="w-full h-11 mb-3 border border-brique/50 text-brique text-[11px] uppercase tracking-[0.22em] hover:bg-brique hover:text-ivory transition rounded-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              Supprimer cette section
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-12 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] hover:bg-emerald transition rounded-sm"
          >
            Fermer
          </button>
          <p className="text-[10px] text-ink/50 text-center mt-3 uppercase tracking-[0.2em]">
            N'oubliez pas <span className="text-emerald">Enregistrer</span> en haut pour publier
          </p>
        </div>
      </aside>
    </div>,
    document.body
  )
}
