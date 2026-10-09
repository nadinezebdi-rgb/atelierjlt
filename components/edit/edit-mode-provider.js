'use client'

/**
 * Atelier JLT — Mode Édition visuelle (iPad-first)
 *
 * Enveloppe la page d'accueil et ajoute un calque d'édition visuelle :
 *   - Barre d'outils flottante en haut
 *   - Chaque section de la home devient tappable (outline + bouton "Modifier")
 *   - Panneau latéral à droite avec les champs de la section sélectionnée
 *   - Réordonnancement vertical des sections par glisser-déposer (tactile)
 *   - Sauvegarde en 1 clic → PATCH /api/admin/site-content
 *
 * Prérequis : être connecté en admin (cookie session).
 * Activation : visiter `?edit=1`.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import {
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Pencil,
  AlertTriangle,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react'
import SectionEditorPanel from './section-editor-panel'

const Ctx = createContext(null)
export const useEditMode = () => useContext(Ctx)

/* ----------------------- Normalisation des sections ----------------------- */

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'sec-' + Math.random().toString(36).slice(2, 10)
}

function normalizeSections(input) {
  return (Array.isArray(input) ? input : []).map((s) => ({
    ...s,
    id: s.id || uid(),
    enabled: s.enabled !== false,
    content: s.content || {},
  }))
}

/* --------------------------- Container principal -------------------------- */

export default function EditModeProvider({
  initialSections,
  initialHero,
  initialHeroSlides,
  children,
}) {
  const [sections, setSections] = useState(() => normalizeSections(initialSections))
  const [hero, setHero] = useState(() => initialHero || {})
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null) // 'ok' | 'error' | null
  const [selectedId, setSelectedId] = useState(null)
  const [reorderMode, setReorderMode] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Virtual hero section (special id = __hero__) — permet d'utiliser le même panneau
  const heroVirtualSection = useMemo(
    () => ({
      id: '__hero__',
      type: 'hero',
      label: 'Hero — image d\u2019accueil',
      enabled: true,
      content: hero || {},
    }),
    [hero]
  )

  const selected = selectedId === '__hero__'
    ? heroVirtualSection
    : (sections.find((s) => s.id === selectedId) || null)

  /* ---- Update helpers ---- */

  const updateSection = useCallback((id, patch) => {
    if (id === '__hero__') {
      setHero((prev) => ({
        ...prev,
        ...(patch.content ? patch.content : patch),
      }))
      setDirty(true)
      return
    }
    setSections((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              ...patch,
              content: patch.content ? { ...s.content, ...patch.content } : s.content,
            }
          : s
      )
    )
    setDirty(true)
  }, [])

  const toggleSection = useCallback((id) => {
    if (id === '__hero__') return // Hero ne peut pas être masqué
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)))
    setDirty(true)
  }, [])

  const reorderSections = useCallback((fromId, toId) => {
    setSections((prev) => {
      const from = prev.findIndex((s) => s.id === fromId)
      const to = prev.findIndex((s) => s.id === toId)
      if (from < 0 || to < 0 || from === to) return prev
      return arrayMove(prev, from, to)
    })
    setDirty(true)
  }, [])

  /* ---- Sauvegarde ---- */

  const save = useCallback(async () => {
    setSaving(true)
    setSaveStatus(null)
    try {
      // Récupère le contenu actuel pour merger plutôt qu'écraser
      const current = await fetch('/api/admin/site-content', { credentials: 'include' })
        .then((r) => r.json())
        .catch(() => ({}))
      const nextContent = {
        ...(current?.content || {}),
        sections,
        hero,
      }
      // IMPORTANT : le handler PATCH enregistre le body COMME content directement,
      // donc on envoie le contenu à plat (sans wrapper { content: ... }).
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
  }, [sections, hero])

  /* ---- Quitter l'édition : prévenir si non enregistré ---- */

  const exitEditMode = useCallback(() => {
    if (dirty && !confirm('Modifications non enregistrées. Quitter sans sauvegarder ?')) return
    const url = new URL(window.location.href)
    url.searchParams.delete('edit')
    window.location.href = url.toString()
  }, [dirty])

  /* ---- Confirmation navigation ---- */

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  /* ---- DnD sensors ---- */

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  )

  const value = useMemo(
    () => ({
      editMode: true,
      sections,
      hero,
      selectedId,
      setSelectedId,
      updateSection,
      toggleSection,
      reorderSections,
      reorderMode,
      dirty,
    }),
    [sections, hero, selectedId, updateSection, toggleSection, reorderSections, reorderMode, dirty]
  )

  return (
    <Ctx.Provider value={value}>
      {/* Padding en haut pour laisser la place à la toolbar sticky */}
      <div className="pt-14 md:pt-16">{children}</div>
      <EditToolbar
        dirty={dirty}
        saving={saving}
        saveStatus={saveStatus}
        onSave={save}
        onExit={exitEditMode}
        reorderMode={reorderMode}
        setReorderMode={setReorderMode}
        onOpenHelp={() => setHelpOpen(true)}
      />
      {reorderMode && (
        <ReorderOverlay
          sections={sections}
          sensors={sensors}
          onReorder={reorderSections}
          onToggle={toggleSection}
          onClose={() => setReorderMode(false)}
        />
      )}
      {selected && (
        <SectionEditorPanel
          section={selected}
          onClose={() => setSelectedId(null)}
          onChange={(patch) => updateSection(selected.id, patch)}
          onToggle={() => toggleSection(selected.id)}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </Ctx.Provider>
  )
}

/* --------------------------- Barre d'outils sticky ------------------------ */

function EditToolbar({ dirty, saving, saveStatus, onSave, onExit, reorderMode, setReorderMode, onOpenHelp }) {
  return (
    <div
      className="fixed top-0 inset-x-0 z-[200] bg-ink text-ivory shadow-lg"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 h-14 md:h-16">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-emerald flex-none" strokeWidth={1.8} />
          <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-ivory/90 truncate">Mode édition</span>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setReorderMode((v) => !v)}
          className={`h-11 px-3 md:px-4 text-[11px] uppercase tracking-[0.22em] rounded-sm transition flex items-center gap-2 ${
            reorderMode ? 'bg-ivory text-ink' : 'bg-ink text-ivory border border-ivory/30 hover:border-ivory'
          }`}
          aria-label="Réorganiser les sections"
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Réorganiser</span>
        </button>
        <button
          onClick={onOpenHelp}
          className="h-11 w-11 flex items-center justify-center border border-ivory/30 hover:border-ivory rounded-sm"
          aria-label="Aide"
        >
          <span className="text-sm font-semibold">?</span>
        </button>
        <button
          onClick={onSave}
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
          onClick={onExit}
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
  )
}

/* --------------- Overlay de réorganisation (drag-drop tactile) ----------- */

function ReorderOverlay({ sections, sensors, onReorder, onToggle, onClose }) {
  if (typeof document === 'undefined') return null

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    onReorder(active.id, over.id)
  }

  return createPortal(
    <div className="fixed inset-0 z-[300] bg-ink/85 backdrop-blur-sm flex items-start md:items-center justify-center p-0 md:p-6">
      <div className="w-full max-w-xl bg-ivory h-full md:h-auto md:max-h-[85vh] md:rounded-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-linen">
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald">Réorganiser</h3>
            <p className="text-xs text-ink/60 mt-1">Glissez pour déplacer, tapez l'œil pour masquer</p>
          </div>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center border border-ink/20 hover:border-ink rounded-sm"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((s) => (
                <SortableRow key={s.id} section={s} onToggle={() => onToggle(s.id)} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <div className="px-5 py-4 border-t border-linen">
          <button
            onClick={onClose}
            className="w-full h-12 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] rounded-sm hover:bg-emerald transition"
          >
            Terminer
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function SortableRow({ section, onToggle }) {
  // We import useSortable here (dynamic avoid circular)
  const { useSortable } = require('@dnd-kit/sortable')
  const { CSS } = require('@dnd-kit/utilities')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 bg-cream border border-linen p-3 md:p-4 mb-2 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="h-11 w-11 flex items-center justify-center text-ink/50 hover:text-ink touch-none"
        aria-label="Glisser pour déplacer"
      >
        <GripVertical className="h-5 w-5" strokeWidth={1.5} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink truncate">{section.label || section.id}</div>
        <div className="text-xs text-ink/50 truncate">{section.type}</div>
      </div>
      <button
        onClick={onToggle}
        className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
        aria-label={section.enabled ? 'Masquer' : 'Afficher'}
        title={section.enabled ? 'Section visible' : 'Section masquée'}
      >
        {section.enabled ? (
          <Eye className="h-4 w-4 text-emerald" strokeWidth={1.5} />
        ) : (
          <EyeOff className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
        )}
      </button>
    </div>
  )
}

/* ------------------- Aide (overlay court, iPad-friendly) ----------------- */

function HelpOverlay({ onClose }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div
      className="fixed inset-0 z-[400] bg-ink/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-ivory md:rounded-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-linen flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald">Comment ça marche</h3>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        <ul className="p-6 space-y-4 text-sm text-ink/80 leading-relaxed">
          <li className="flex gap-3">
            <span className="text-emerald text-xl leading-none">1.</span>
            <span>Tapez sur <strong>n'importe quelle section</strong> de la page pour la modifier (textes, images, titres…)</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald text-xl leading-none">2.</span>
            <span>Tapez sur <strong>Réorganiser</strong> pour changer l'ordre ou masquer une section</span>
          </li>
          <li className="flex gap-3">
            <span className="text-emerald text-xl leading-none">3.</span>
            <span>Tapez sur <strong>Enregistrer</strong> pour publier vos changements en direct sur le site</span>
          </li>
          <li className="pt-2 border-t border-linen text-ink/60 text-xs italic">
            Astuce : Juliette (le petit bouton rond en bas) peut tout faire à votre place en langage naturel. Dites-lui par exemple : « Change le titre de la bannière en Bienvenue chez nous ».
          </li>
        </ul>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full h-12 bg-ink text-ivory text-[11px] uppercase tracking-[0.28em] rounded-sm hover:bg-emerald transition"
          >
            Compris
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
