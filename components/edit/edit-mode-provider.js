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
  Plus,
  Images,
  Film,
  LayoutGrid,
  ShoppingBag,
  Gift,
  Bed,
  Sofa,
  Heart,
  Star,
  Flower,
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
  const [structuralChange, setStructuralChange] = useState(false)
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

  /* ---- Ajout de section personnalisée (vitrine multi-carrousels) ---- */

  const addSection = useCallback((type, overrides = {}) => {
    const unique = Math.random().toString(36).slice(2, 8)
    const id = overrides.id || `custom-${type}-${unique}`
    const presets = {
      'product-carousel': {
        label: 'Nouveau carrousel',
        content: {
          eyebrow: 'La sélection',
          title: 'Vitrine personnalisée',
          description: '',
          viewAllHref: '/collections',
          filter: 'all',
          limit: 8,
          hideBadges: false,
          pickedProducts: [],
        },
      },
      'editorial-banner': {
        label: 'Nouvelle bannière',
        content: {
          eyebrow: '',
          title: 'Nouveau titre',
          image: '',
          ctaLabel: '',
          ctaHref: '',
          align: 'left',
          overlay: 'dark',
          height: 'md',
        },
      },
    }
    const preset = presets[type] || presets['editorial-banner']
    const newSection = {
      id,
      type,
      custom: true,
      enabled: true,
      label: preset.label,
      ...overrides,
      content: { ...preset.content, ...(overrides.content || {}) },
    }
    setSections((prev) => [...prev, newSection])
    setSelectedId(id)
    setDirty(true)
    setStructuralChange(true)
    return id
  }, [])

  const removeSection = useCallback((id) => {
    setSections((prev) => prev.filter((s) => s.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
    setDirty(true)
    setStructuralChange(true)
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
      // Recharge seulement si la structure a changé (ajout/suppression de section)
      // pour que la nouvelle section apparaisse à l'écran. Les éditions "normales"
      // préservent le scroll.
      if (structuralChange) {
        setTimeout(() => window.location.reload(), 1000)
      } else {
        setTimeout(() => setSaveStatus(null), 2500)
      }
    } catch (e) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 4000)
    } finally {
      setSaving(false)
    }
  }, [sections, hero, structuralChange])

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
      addSection,
      removeSection,
      reorderMode,
      dirty,
    }),
    [sections, hero, selectedId, updateSection, toggleSection, reorderSections, addSection, removeSection, reorderMode, dirty]
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
        onAddSection={addSection}
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
          onRemove={selected.custom ? () => removeSection(selected.id) : null}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
    </Ctx.Provider>
  )
}

/* --------------------------- Barre d'outils sticky ------------------------ */

function EditToolbar({ dirty, saving, saveStatus, onSave, onExit, reorderMode, setReorderMode, onOpenHelp, onAddSection }) {
  const [addOpen, setAddOpen] = useState(false)
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
          onClick={() => setAddOpen(true)}
          className="h-11 px-3 md:px-4 text-[11px] uppercase tracking-[0.22em] rounded-sm transition flex items-center gap-2 bg-ivory text-ink hover:bg-emerald hover:text-ivory"
          aria-label="Ajouter une section"
        >
          <Plus className="h-4 w-4" strokeWidth={1.8} />
          <span className="hidden sm:inline">Ajouter</span>
        </button>
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
      {addOpen && (
        <AddSectionModal
          onClose={() => setAddOpen(false)}
          onPick={(type, overrides) => { onAddSection(type, overrides); setAddOpen(false) }}
        />
      )}
    </div>
  )
}

/* ---- Modal "Ajouter une section" — templates prêts à l'emploi ---- */

const SECTION_TEMPLATES = [
  {
    key: 'gift',
    icon: Gift,
    accent: 'bg-terracotta',
    title: 'Idées cadeau',
    tagline: 'À offrir',
    description: "Une sélection pour offrir — plaids, bougies, petits objets.",
    type: 'product-carousel',
    overrides: {
      label: 'Idées cadeau',
      content: {
        eyebrow: 'À offrir',
        title: 'Idées cadeau.',
        description: 'Nos pièces les plus douces à glisser sous le sapin ou dans un panier.',
        viewAllHref: '/collections',
        filter: 'all',
        limit: 6,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
  {
    key: 'new-season',
    icon: Sparkles,
    accent: 'bg-emerald',
    title: 'Nouveau de la saison',
    tagline: 'Nouveautés',
    description: "Fraîchement sortis de l'atelier — vos dernières arrivées.",
    type: 'product-carousel',
    overrides: {
      label: 'Nouveau de la saison',
      content: {
        eyebrow: 'Nouveautés',
        title: "Fraîchement sortis de l'atelier.",
        description: "Les pièces qui viennent d'être terminées — à découvrir en premier.",
        viewAllHref: '/collections?cat=nouveautes',
        filter: 'new',
        limit: 8,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
  {
    key: 'bedroom',
    icon: Bed,
    accent: 'bg-plantes',
    title: 'Pour la chambre',
    tagline: 'La chambre',
    description: 'Plaids crochet, coussins doux, textures apaisantes.',
    type: 'product-carousel',
    overrides: {
      label: 'Pour la chambre',
      content: {
        eyebrow: 'La chambre',
        title: 'Douceur sur le lit.',
        description: 'Plaids crochet et coussins pour habiller la chambre.',
        viewAllHref: '/collections',
        filter: 'classiques',
        limit: 6,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
  {
    key: 'living',
    icon: Sofa,
    accent: 'bg-brique',
    title: 'Pour le salon',
    tagline: 'Le salon',
    description: 'Tapis, macramés et plaids pour une pièce chaleureuse.',
    type: 'product-carousel',
    overrides: {
      label: 'Pour le salon',
      content: {
        eyebrow: 'Le salon',
        title: "L'atmosphère du salon.",
        description: 'Tapis, macramés et plaids pour une pièce chaleureuse.',
        viewAllHref: '/collections?cat=intemporels',
        filter: 'intemporels',
        limit: 8,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
  {
    key: 'favorites',
    icon: Heart,
    accent: 'bg-ink',
    title: 'Coups de cœur',
    tagline: 'Sélection manuelle',
    description: 'Vous choisissez vous-même les produits à mettre en avant.',
    type: 'product-carousel',
    overrides: {
      label: 'Coups de cœur',
      content: {
        eyebrow: 'Mes favoris',
        title: 'Les pièces du moment.',
        description: '',
        viewAllHref: '/collections',
        filter: 'all',
        limit: 6,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
  {
    key: 'spring',
    icon: Flower,
    accent: 'bg-plantes',
    title: 'Collection saisonnière',
    tagline: 'Printemps / Été',
    description: 'Mettez en avant la collection de la saison.',
    type: 'product-carousel',
    overrides: {
      label: 'Collection PE 26-27',
      content: {
        eyebrow: 'Printemps / Été 2026-2027',
        title: 'La collection de la saison.',
        description: 'Pastels, lin et douceur florale pour la nouvelle saison.',
        viewAllHref: '/collection/printemps-ete-2026-2027',
        filter: 'pe-2026-2027',
        limit: 6,
        hideBadges: false,
        pickedProducts: [],
      },
    },
  },
]

const BLANK_OPTIONS = [
  {
    key: 'blank-carousel',
    icon: ShoppingBag,
    title: 'Carrousel vierge',
    description: 'Partez de zéro, filtrez ou sélectionnez les produits à la main.',
    type: 'product-carousel',
    overrides: null,
  },
  {
    key: 'blank-banner',
    icon: Images,
    title: 'Bannière éditoriale',
    description: 'Une grande image avec titre, texte et un bouton. Pour les ambiances.',
    type: 'editorial-banner',
    overrides: null,
  },
]

function AddSectionModal({ onClose, onPick }) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-stretch md:items-center justify-center bg-ink/60 p-0 md:p-6">
      <div
        className="bg-ivory w-full md:max-w-3xl md:rounded-sm shadow-2xl flex flex-col"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          maxHeight: '100dvh',
        }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-linen">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Nouvelle section</div>
            <div className="font-display text-xl md:text-2xl">Choisissez un modèle</div>
          </div>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-3 flex items-center gap-2">
            <Sparkles className="h-3 w-3 text-emerald" strokeWidth={1.8} />
            Modèles prêts à l'emploi
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {SECTION_TEMPLATES.map((t) => (
              <button
                key={t.key}
                onClick={() => onPick(t.type, t.overrides)}
                className="text-left flex items-start gap-3 p-4 border border-linen hover:border-emerald hover:bg-cream/40 transition rounded-sm group"
              >
                <div className={`h-11 w-11 flex-none flex items-center justify-center ${t.accent} text-ivory rounded-sm group-hover:scale-105 transition`}>
                  <t.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] uppercase tracking-[0.22em] text-emerald mb-0.5">
                    {t.tagline}
                  </div>
                  <div className="font-display text-base md:text-lg leading-tight">{t.title}</div>
                  <div className="text-xs text-ink/60 mt-1 leading-relaxed">{t.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-3 flex items-center gap-2">
            <Plus className="h-3 w-3" strokeWidth={1.8} />
            Partir d'une page blanche
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BLANK_OPTIONS.map((o) => (
              <button
                key={o.key}
                onClick={() => onPick(o.type, o.overrides)}
                className="text-left flex items-start gap-3 p-4 border border-dashed border-ink/20 hover:border-ink hover:bg-ink/5 transition rounded-sm group"
              >
                <div className="h-11 w-11 flex-none flex items-center justify-center bg-ink/10 text-ink rounded-sm group-hover:bg-ink group-hover:text-ivory transition">
                  <o.icon className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base md:text-lg leading-tight">{o.title}</div>
                  <div className="text-xs text-ink/60 mt-1 leading-relaxed">{o.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-linen bg-cream/30">
          <p className="text-[10px] text-ink/60 uppercase tracking-[0.22em] text-center">
            La nouvelle section apparaît en bas de la page. Vous pouvez la personnaliser et la déplacer ensuite.
          </p>
        </div>
      </div>
    </div>,
    document.body
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
