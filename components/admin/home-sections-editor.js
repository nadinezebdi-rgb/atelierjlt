'use client'

/**
 * Admin → Éditeur du site → Sections de la page d'accueil.
 *
 * Utilise EXACTEMENT les mêmes champs (SectionFields) et la même bibliothèque
 * de modèles (AddSectionModal) que le mode édition visuel /?edit=1 :
 * tout ce qu'on peut faire en édition visuelle se fait aussi ici.
 */
import { useMemo, useState } from 'react'
import { Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical, Layers, Sparkles, Wand2, Hand } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOMEPAGE_SECTION_DEFAULTS, CAROUSEL_FILTERS, getCarouselMode, filterProductsForCarousel } from '@/lib/homepage-sections'
import SectionFields, { useAllProducts, INPUT_CLS, LABEL_CLS } from '@/components/edit/section-fields'
import AddSectionModal, { createSection } from '@/components/edit/add-section-modal'

const SECTION_INFO = {
  'editorial-banner': {
    niceName: 'Bannière éditoriale',
    icon: '🖼️',
    explain: 'Grande image plein-écran avec un titre et un bouton.',
  },
  'product-carousel': {
    niceName: 'Carrousel de produits',
    icon: '🛍️',
    explain: 'Rangée de produits qui défile — choisis automatiquement ou par vous.',
  },
  'category-tiles': { niceName: 'Grille des collections', icon: '🗂️', explain: 'Les grandes vignettes de collections cliquables.' },
  'collections-themes': { niceName: 'Détail des collections', icon: '✨', explain: 'Présentation détaillée de chaque collection.' },
  lifestyle: { niceName: 'Scène de vie', icon: '🏡', explain: 'Une grande photo d\'ambiance avec un texte.' },
  'iconic-plaid': { niceName: 'Pièce iconique', icon: '⭐', explain: 'Mise en avant d\'une pièce phare.' },
  newsletter: { niceName: 'Inscription newsletter', icon: '✉️', explain: 'Le bloc où les visiteuses laissent leur email.' },
}

function HomeSectionsEditor({ sections, onChange }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!Array.isArray(sections)) return null

  const patchAt = (i, patch) => {
    const next = sections.slice()
    next[i] = { ...next[i], ...patch }
    onChange(next)
  }
  const toggleEnabled = (i) => patchAt(i, { enabled: !sections[i].enabled })
  const updContent = (i, patch) => patchAt(i, { content: { ...(sections[i].content || {}), ...patch } })
  const updLabel = (i, value) => patchAt(i, { label: value })
  const removeSection = (i) => {
    if (!confirm('Supprimer cette section définitivement ?')) return
    const next = sections.slice()
    next.splice(i, 1)
    onChange(next)
  }
  const addSection = (type, overrides) => {
    const s = createSection(type, overrides)
    onChange([...sections, s])
    setExpandedId(s.id)
    setPickerOpen(false)
    setTimeout(() => {
      try { document.getElementById(`admin-section-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
    }, 150)
  }
  const resetAll = () => {
    if (!confirm('Réinitialiser toutes les sections à leur configuration par défaut ? Les sections personnalisées seront supprimées.')) return
    onChange(HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } })))
  }

  // Drag & drop (souris) + flèches (tactile / clavier)
  const onDragStart = (i) => (e) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
  }
  const onDragOver = (i) => (e) => {
    e.preventDefault()
    if (i !== overIdx) setOverIdx(i)
  }
  const onDrop = (i) => (e) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
    const next = sections.slice()
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDragIdx(null); setOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null) }
  const moveSection = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = sections.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8" data-testid="admin-home-sections">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.5} /> Sections de la page d'accueil
          </h3>
          <p className="text-xs text-ink/70 mt-2 max-w-2xl leading-relaxed">
            Chaque ligne est <strong>un bloc visible sur la page d'accueil</strong>. Touchez une ligne pour la modifier :
            vous y trouvez <strong>les mêmes réglages que dans l'édition visuelle</strong> (textes, images, choix des produits, modèles…).
            Utilisez ↑↓ pour réordonner et « Visible » pour masquer sans supprimer.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            data-testid="admin-add-section"
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] px-4 h-11 bg-emerald text-ivory hover:bg-emeraldDark transition"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Ajouter une section
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="text-[10px] uppercase tracking-[0.22em] px-3 h-11 border border-ink/20 hover:border-terracotta hover:text-terracotta transition whitespace-nowrap"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <ol className="space-y-3" onDragEnd={onDragEnd}>
        {sections.map((s, i) => {
          const isExpanded = expandedId === s.id
          const isDragging = dragIdx === i
          const isOver = overIdx === i && dragIdx !== i
          return (
            <li
              key={s.id}
              id={`admin-section-${s.id}`}
              data-testid={`admin-section-${s.id}`}
              draggable={!isExpanded}
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              className={cn(
                'border transition relative scroll-mt-24',
                s.enabled ? 'border-linen bg-ivory' : 'border-dashed border-ink/15 bg-cream/30',
                isDragging && 'opacity-40',
                isOver && 'ring-2 ring-emerald ring-offset-2 ring-offset-ivory'
              )}
            >
              <div className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0 flex items-center bg-cream border border-linen hover:border-emerald transition">
                  <div className="cursor-grab active:cursor-grabbing p-2 text-ink/40 hover:text-emerald transition hidden md:block" title="Glisser pour réordonner">
                    <GripVertical className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col md:border-l border-linen">
                    <button type="button" draggable={false} onClick={(e) => { e.stopPropagation(); moveSection(i, -1) }} disabled={i === 0} aria-label="Monter" className="px-2.5 py-1.5 hover:bg-emerald/10 hover:text-emerald disabled:opacity-25 disabled:cursor-not-allowed transition">
                      <ArrowUp className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                    <button type="button" draggable={false} onClick={(e) => { e.stopPropagation(); moveSection(i, 1) }} disabled={i === sections.length - 1} aria-label="Descendre" className="px-2.5 py-1.5 border-t border-linen hover:bg-emerald/10 hover:text-emerald disabled:opacity-25 disabled:cursor-not-allowed transition">
                      <ArrowDown className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                <span className="w-6 text-center text-[11px] tabular-nums font-semibold text-emerald bg-emerald/10 rounded-full py-0.5 flex-shrink-0">
                  {i + 1}
                </span>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex-1 min-w-0 text-left group"
                  data-testid={`admin-section-toggle-${s.id}`}
                >
                  <div className="font-display text-base leading-tight truncate group-hover:text-emerald transition flex items-center gap-2">
                    <span className="text-base leading-none">{SECTION_INFO[s.type]?.icon || '📄'}</span>
                    <span className="truncate">{s.label}</span>
                    {s.custom && (
                      <span className="ml-1 text-[9px] uppercase tracking-[0.24em] bg-terracotta/15 text-terracotta px-2 py-0.5 align-middle">Perso</span>
                    )}
                  </div>
                  <div className="text-xs text-ink/55 mt-1 leading-snug line-clamp-1">
                    {s.type === 'product-carousel' ? <CarouselSummary content={s.content} /> : (SECTION_INFO[s.type]?.explain || s.type)}
                  </div>
                </button>

                <div className="hidden md:block flex-shrink-0">
                  <SectionPreview section={s} compact />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                  <input type="checkbox" checked={!!s.enabled} onChange={() => toggleEnabled(i)} className="h-4 w-4" />
                  <span className={`text-[11px] uppercase tracking-[0.22em] hidden sm:inline ${s.enabled ? 'text-emerald' : 'text-ink/40'}`}>
                    {s.enabled ? (
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Visible</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> Masqué</span>
                    )}
                  </span>
                </label>

                {s.custom && (
                  <button type="button" onClick={() => removeSection(i)} className="h-10 w-10 flex items-center justify-center text-terracotta hover:bg-terracotta/10 flex-shrink-0" aria-label="Supprimer la section">
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-linen/60 bg-cream/20 p-5">
                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Aperçu</div>
                      <SectionPreview section={s} />
                      <a
                        href="/?edit=1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink/60 hover:text-emerald"
                      >
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} /> Voir sur la page (édition visuelle)
                      </a>
                    </div>
                    <div className="min-w-0">
                      {s.custom && (
                        <div className="mb-5">
                          <span className={LABEL_CLS}>Nom de la section (visible seulement en admin)</span>
                          <input value={s.label || ''} onChange={(e) => updLabel(i, e.target.value)} className={INPUT_CLS} />
                        </div>
                      )}
                      <SectionFields section={s} updateContent={(patch) => updContent(i, patch)} />
                    </div>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ol>

      <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-ink/45">
        Cliquez sur <strong>Enregistrer</strong> en haut pour appliquer les changements.
      </p>

      {pickerOpen && <AddSectionModal onClose={() => setPickerOpen(false)} onPick={addSection} />}
    </section>
  )
}

function CarouselSummary({ content }) {
  const c = content || {}
  const mode = getCarouselMode(c)
  const n = Array.isArray(c.pickedProducts) ? c.pickedProducts.length : 0
  if (mode === 'manual') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Hand className="h-3 w-3 text-emerald" strokeWidth={1.8} />
        Je choisis · {n} produit{n > 1 ? 's' : ''} sélectionné{n > 1 ? 's' : ''}
      </span>
    )
  }
  const f = CAROUSEL_FILTERS.find((x) => x.v === (c.filter || 'all'))
  return (
    <span className="inline-flex items-center gap-1.5">
      <Wand2 className="h-3 w-3 text-emerald" strokeWidth={1.8} />
      Automatique · {f?.label || c.filter}
    </span>
  )
}

/* Aperçu d'une section — pour les carrousels : les vrais produits */
function SectionPreview({ section, compact = false }) {
  const s = section
  const c = s.content || {}
  const size = compact ? 'w-32 h-14' : 'w-full aspect-[16/9] max-w-md'

  if (s.type === 'editorial-banner') {
    return (
      <div className={`${size} relative overflow-hidden bg-cream border border-linen`}>
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/40">Image</div>
        )}
        <div className="absolute inset-0 bg-ink/30" />
        <div className={`absolute inset-0 flex flex-col justify-end p-2 ${c.align === 'right' ? 'items-end text-right' : 'items-start'}`}>
          {c.eyebrow && !compact && <div className="text-[10px] uppercase tracking-[0.22em] text-ivory/90">{c.eyebrow}</div>}
          <div className={`font-display text-ivory leading-tight ${compact ? 'text-[10px]' : 'text-lg'} truncate max-w-full`}>{c.title || 'Titre'}</div>
          {!compact && c.ctaLabel && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ivory border-b border-ivory/60 pb-0.5">{c.ctaLabel} →</div>
          )}
        </div>
      </div>
    )
  }

  if (s.type === 'product-carousel') return <CarouselPreview content={c} compact={compact} />

  const label = s.type === 'newsletter' ? 'Newsletter' : s.type === 'category-tiles' ? 'Grille collections' : s.type === 'collections-themes' ? 'Détail collections' : s.type
  return (
    <div className={`${size} bg-linen/50 border border-linen flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/50 text-center px-2`}>
      {label}
    </div>
  )
}

function CarouselPreview({ content, compact }) {
  const all = useAllProducts()
  const c = content || {}
  const mode = getCarouselMode(c)
  const picked = Array.isArray(c.pickedProducts) ? c.pickedProducts : []
  const list = useMemo(() => {
    if (!all) return []
    if (mode === 'manual' && picked.length) {
      const map = new Map(all.map((p) => [p.slug, p]))
      return picked.map((sl) => map.get(sl)).filter(Boolean)
    }
    return filterProductsForCarousel(all, c.filter).slice(0, Number(c.limit) || 8)
  }, [all, mode, picked.join(','), c.filter, c.limit])

  if (compact) {
    return (
      <div className="w-32 h-14 border border-linen bg-cream/40 p-1 flex gap-1 overflow-hidden">
        {list.slice(0, 3).map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={p.slug} src={p.images?.[0]} alt="" className="h-full aspect-[4/5] object-cover" />
        ))}
        {!list.length && <div className="flex-1 flex items-center justify-center text-[9px] uppercase tracking-[0.2em] text-ink/40">Vide</div>}
      </div>
    )
  }
  return (
    <div className="w-full max-w-md border border-linen bg-ivory p-3">
      <div className="text-[9px] uppercase tracking-[0.22em] text-emerald">{c.eyebrow || 'Carrousel'}</div>
      <div className="font-display text-base mt-1 truncate">{c.title || 'Carrousel produits'}</div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {list.slice(0, 6).map((p) => (
          <div key={p.slug} className="w-20 flex-none">
            <div className="aspect-[4/5] bg-cream overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
            </div>
            <div className="text-[10px] mt-1 truncate">{p.name}</div>
            <div className="text-[10px] text-ink/55 tabular-nums">{Number(p.price || 0).toFixed(0)} €</div>
          </div>
        ))}
        {!list.length && <div className="text-xs text-ink/50 py-6">{all ? 'Aucun produit pour le moment.' : 'Chargement…'}</div>}
      </div>
    </div>
  )
}

export default HomeSectionsEditor
