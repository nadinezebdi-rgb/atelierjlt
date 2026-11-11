'use client'

/**
 * Aperçu EN DIRECT des sections de l'accueil en mode édition.
 * Les sections sont lues depuis le contexte d'édition : chaque modification
 * (texte, produits choisis, ordre, ajout, suppression) s'affiche immédiatement
 * sur la page, avant même d'enregistrer.
 */
import { useEditMode } from './edit-mode-provider'
import SectionShell from './section-shell'
import renderSection from '@/components/home/render-section'

export default function LiveSections({ fallback = [] }) {
  const edit = useEditMode()
  const sections = edit?.sections || fallback
  return sections.map((s) => (
    <SectionShell key={s.id} section={s}>
      {renderSection(s, { ignoreEnabled: true }) || (
        <div className="py-16 text-center text-[11px] uppercase tracking-[0.24em] text-ink/40">
          {s.label || s.type}
        </div>
      )}
    </SectionShell>
  ))
}
