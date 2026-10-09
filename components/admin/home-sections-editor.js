'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'
import { HOMEPAGE_SECTION_DEFAULTS, BANNER_TEMPLATES } from '@/lib/homepage-sections'
import CarouselImageEditor from '@/components/admin/carousel-image-editor'
import ImageUploader from './image-uploader'
import Field from './shared-field'

function HomeSectionsEditor({ sections, onChange }) {
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // Vocabulaire humain par type de section — pour que la nouvelle administratrice
  // comprenne immédiatement ce que fait chaque bannière, sans jargon technique.
  const SECTION_INFO = {
    'editorial-banner': {
      niceName: 'Bannière éditoriale',
      icon: '🖼️',
      explain: 'Grande image plein-écran avec un titre et un bouton. Idéal pour mettre en avant un produit, une collection ou une actualité.',
    },
    'product-carousel': {
      niceName: 'Carrousel de produits',
      icon: '🛍️',
      explain: 'Rangée de produits qui défile — nouveautés, meilleures ventes, favoris… ou vos propres photos si vous préférez.',
    },
    'category-tiles': {
      niceName: 'Grille des collections',
      icon: '🗂️',
      explain: 'Les deux grandes vignettes « Racine » et « Empreinte » cliquables.',
    },
    'collections-themes': {
      niceName: 'Détail des collections',
      icon: '✨',
      explain: 'Présentation plus détaillée de chaque collection avec sous-liens (plaids, coussins…).',
    },
    'lifestyle': {
      niceName: 'Scène de vie',
      icon: '🏡',
      explain: 'Bloc d\'inspiration : une grande photo d\'ambiance avec un texte.',
    },
    'iconic-plaid': {
      niceName: 'Pièce iconique',
      icon: '⭐',
      explain: 'Mise en avant d\'une pièce phare (actuellement : le Plaid Sylvestre).',
    },
    'newsletter': {
      niceName: 'Inscription newsletter',
      icon: '✉️',
      explain: 'Le bloc en bas de page pour que les visiteuses laissent leur email.',
    },
  }

  if (!Array.isArray(sections)) return null

  const toggleEnabled = (i) => {
    const next = sections.slice()
    next[i] = { ...next[i], enabled: !next[i].enabled }
    onChange(next)
  }
  const updContent = (i, key, value) => {
    const next = sections.slice()
    next[i] = { ...next[i], content: { ...(next[i].content || {}), [key]: value } }
    onChange(next)
  }
  const updLabel = (i, value) => {
    const next = sections.slice()
    next[i] = { ...next[i], label: value }
    onChange(next)
  }
  const removeSection = (i) => {
    if (!confirm('Supprimer cette bannière personnalisée ?')) return
    const next = sections.slice()
    next.splice(i, 1)
    onChange(next)
  }
  const addFromTemplate = (template) => {
    const id = 'custom-' + Math.random().toString(36).slice(2, 8)
    const newSection = {
      id,
      type: 'editorial-banner',
      label: template.name === 'Vierge' ? 'Nouvelle bannière' : template.name,
      enabled: true,
      custom: true,
      content: { ...template.preset },
    }
    onChange([...sections, newSection])
    setExpandedId(id)
    setPickerOpen(false)
  }
  const resetAll = () => {
    if (!confirm('Réinitialiser toutes les sections à leur configuration par défaut ? Les bannières personnalisées seront supprimées.')) return
    onChange(HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } })))
  }

  // Drag & drop
  const onDragStart = (i) => (e) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    // Firefox requires setData
    try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
  }
  const onDragOver = (i) => (e) => {
    e.preventDefault()
    if (i !== overIdx) setOverIdx(i)
  }
  const onDrop = (i) => (e) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) {
      setDragIdx(null); setOverIdx(null); return
    }
    const next = sections.slice()
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDragIdx(null); setOverIdx(null)
  }
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  // Boutons ↑ ↓ (alternative accessible / mobile)
  const moveSection = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = sections.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.5} /> Sections de la page d'accueil
          </h3>
          <p className="text-xs text-ink/70 mt-2 max-w-2xl leading-relaxed">
            Chaque ligne ci-dessous est <strong>un bloc visible sur la page d'accueil</strong>.
            L'icône à gauche aide à reconnaître ce que c'est : 🖼️ grande image, 🛍️ carrousel de produits, 🗂️ grille de collections, ✉️ newsletter…
            <br/><br/>
            <strong>Pour la nouvelle administratrice :</strong> glissez la poignée ou utilisez ↑↓ pour réordonner,
            cliquez sur une ligne pour modifier son contenu, décochez « Visible » pour la masquer temporairement sans la supprimer.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] px-3 py-2 bg-emerald text-ivory hover:bg-emeraldDark transition"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} /> Ajouter une bannière
          </button>
          <button
            type="button"
            onClick={resetAll}
            className="text-[10px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 hover:border-terracotta hover:text-terracotta transition whitespace-nowrap"
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
              draggable
              onDragStart={onDragStart(i)}
              onDragOver={onDragOver(i)}
              onDrop={onDrop(i)}
              className={cn(
                'border transition relative',
                s.enabled ? 'border-linen bg-ivory' : 'border-dashed border-ink/15 bg-cream/30',
                isDragging && 'opacity-40',
                isOver && 'ring-2 ring-emerald ring-offset-2 ring-offset-ivory'
              )}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Zone de réordonnancement : poignée + flèches ↑↓ */}
                <div
                  className="flex-shrink-0 flex items-center bg-cream border border-linen hover:border-emerald transition"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Poignée de glisser — plus large, coloré au hover */}
                  <div
                    className="cursor-grab active:cursor-grabbing p-2 text-ink/40 hover:text-emerald hover:bg-emerald/5 transition"
                    title="Glisser pour réordonner"
                  >
                    <GripVertical className="h-4 w-4" strokeWidth={2} />
                  </div>
                  {/* Boutons ↑ ↓ — accessibles clavier/mobile */}
                  <div className="flex flex-col border-l border-linen">
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => { e.stopPropagation(); moveSection(i, -1) }}
                      disabled={i === 0}
                      aria-label="Monter"
                      title="Monter"
                      className="px-2 py-0.5 hover:bg-emerald/10 hover:text-emerald disabled:opacity-25 disabled:cursor-not-allowed transition"
                    >
                      <ArrowUp className="h-3 w-3" strokeWidth={2} />
                    </button>
                    <button
                      type="button"
                      draggable={false}
                      onClick={(e) => { e.stopPropagation(); moveSection(i, 1) }}
                      disabled={i === sections.length - 1}
                      aria-label="Descendre"
                      title="Descendre"
                      className="px-2 py-0.5 border-t border-linen hover:bg-emerald/10 hover:text-emerald disabled:opacity-25 disabled:cursor-not-allowed transition"
                    >
                      <ArrowDown className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </div>
                </div>

                {/* Numéro d'ordre */}
                <span className="w-6 text-center text-[11px] tabular-nums font-semibold text-emerald bg-emerald/10 rounded-full py-0.5 flex-shrink-0">
                  {i + 1}
                </span>

                {/* Section label + type — cliquable pour développer */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : s.id)}
                  className="flex-1 min-w-0 text-left group"
                >
                  <div className="font-display text-base leading-tight truncate group-hover:text-emerald transition flex items-center gap-2">
                    <span className="text-base leading-none">{SECTION_INFO[s.type]?.icon || '📄'}</span>
                    <span className="truncate">{s.label}</span>
                    {s.custom && (
                      <span className="ml-1 text-[9px] uppercase tracking-[0.24em] bg-terracotta/15 text-terracotta px-2 py-0.5 align-middle">
                        Perso
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-ink/55 mt-1 leading-snug line-clamp-1">
                    {SECTION_INFO[s.type]?.explain || s.type}
                  </div>
                </button>

                {/* Live preview thumbnail */}
                <div className="hidden md:block flex-shrink-0">
                  <SectionPreview section={s} compact />
                </div>

                {/* Enable toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={!!s.enabled}
                    onChange={() => toggleEnabled(i)}
                    className="h-4 w-4"
                  />
                  <span className={`text-[11px] uppercase tracking-[0.22em] hidden sm:inline ${s.enabled ? 'text-emerald' : 'text-ink/40'}`}>
                    {s.enabled ? (
                      <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Visible</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} /> Masqué</span>
                    )}
                  </span>
                </label>

                {/* Delete (custom only) */}
                {s.custom && (
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    className="p-1 text-terracotta hover:opacity-70 flex-shrink-0"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                )}
              </div>

              {/* Aperçu large + éditeur */}
              {isExpanded && (
                <div className="border-t border-linen/60 bg-cream/20 p-5">
                  <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-6">
                    {/* Preview grand */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Aperçu</div>
                      <SectionPreview section={s} />
                    </div>
                    {/* Editor */}
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">Contenu</div>
                      {s.custom && (
                        <Field label="Nom (visible seulement en admin)">
                          <input
                            value={s.label || ''}
                            onChange={(e) => updLabel(i, e.target.value)}
                            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
                          />
                        </Field>
                      )}
                      <SectionContentEditor
                        type={s.type}
                        content={s.content || {}}
                        onChange={(key, value) => updContent(i, key, value)}
                      />
                      {s.type !== 'editorial-banner' && s.type !== 'product-carousel' && (
                        <p className="text-[11px] text-ink/50 italic">
                          Cette section n’a pas de contenu modifiable. Utilisez le toggle pour l’afficher ou la masquer.
                        </p>
                      )}
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

      {/* Modale — bibliothèque de modèles de bannières */}
      <AnimatePresence>
        {pickerOpen && (
          <TemplatePicker
            onClose={() => setPickerOpen(false)}
            onPick={addFromTemplate}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

/* Modale — choix d'un modèle de bannière */
function TemplatePicker({ onClose, onPick }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/50 z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-4 top-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[10vh] md:w-[min(920px,92vw)] max-h-[84vh] overflow-auto bg-ivory z-50 shadow-2xl"
      >
        <div className="sticky top-0 bg-ivory/95 backdrop-blur border-b border-linen flex items-center justify-between p-6">
          <div>
            <span className="text-[10px] uppercase tracking-[0.32em] text-emerald">
              Bibliothèque de modèles
            </span>
            <h3 className="font-display text-2xl mt-1">Choisissez un modèle</h3>
            <p className="text-xs text-ink/60 mt-1">Vous pourrez tout modifier ensuite.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="hover:opacity-60 transition"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BANNER_TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onPick(t)}
              className="group text-left border border-linen bg-ivory hover:border-emerald hover:shadow-lg transition overflow-hidden"
            >
              {/* Preview */}
              <div className="relative aspect-[16/10] bg-cream overflow-hidden">
                {t.preset.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.preset.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover img-zoom"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[11px] uppercase tracking-[0.24em] text-ink/40">
                    Sans image
                  </div>
                )}
                <div className="absolute inset-0 bg-ink/30" />
                <div className={`absolute inset-0 flex flex-col justify-end p-4 ${t.preset.align === 'right' ? 'items-end text-right' : 'items-start'}`}>
                  <div className="text-[9px] uppercase tracking-[0.28em] text-ivory/90">
                    {t.preset.eyebrow}
                  </div>
                  <div className="font-display text-ivory text-lg leading-tight mt-1 line-clamp-2 max-w-full">
                    {t.preset.title}
                  </div>
                  {t.preset.ctaLabel && (
                    <div className="mt-2 inline-block text-[9px] uppercase tracking-[0.24em] text-ivory border border-ivory/70 px-3 py-1">
                      {t.preset.ctaLabel}
                    </div>
                  )}
                </div>
              </div>

              {/* Label */}
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        t.accent === 'terracotta' ? '#B85B45' :
                        t.accent === 'emerald' ? '#0F5C3F' :
                        t.accent === 'sable' ? '#D4C7A9' :
                        t.accent === 'brique' ? '#8B4A3E' :
                        '#211E1A',
                    }}
                  />
                  <div className="font-display text-lg group-hover:text-emerald transition">
                    {t.name}
                  </div>
                </div>
                <p className="text-[12px] text-ink/60 mt-1">{t.tagline}</p>
                <div className="mt-3 text-[10px] uppercase tracking-[0.22em] text-emerald opacity-0 group-hover:opacity-100 transition">
                  Utiliser ce modèle →
                </div>
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

/* Aperçu miniature d'une section */
function SectionPreview({ section, compact = false }) {
  const s = section
  const c = s.content || {}
  const size = compact
    ? 'w-32 h-14'
    : 'w-full aspect-[16/9] max-w-md'

  const badge = (label) => (
    <div className={`${size} bg-linen/50 border border-linen flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/50 text-center px-2`}>
      {label}
    </div>
  )

  if (s.type === 'editorial-banner') {
    return (
      <div className={`${size} relative overflow-hidden bg-cream border border-linen`}>
        {c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-[0.22em] text-ink/40">
            Image
          </div>
        )}
        <div className="absolute inset-0 bg-ink/30" />
        <div className={`absolute inset-0 flex flex-col justify-end p-2 ${c.align === 'right' ? 'items-end text-right' : 'items-start'}`}>
          {c.eyebrow && (
            <div className={`text-[7px] uppercase tracking-[0.22em] text-ivory/90 ${compact ? '' : 'text-[10px]'}`}>
              {c.eyebrow}
            </div>
          )}
          <div className={`font-display text-ivory leading-tight ${compact ? 'text-[10px]' : 'text-lg'} truncate max-w-full`}>
            {c.title || 'Titre'}
          </div>
          {!compact && c.ctaLabel && (
            <div className="mt-2 text-[10px] uppercase tracking-[0.22em] text-ivory border-b border-ivory/60 pb-0.5">
              {c.ctaLabel} →
            </div>
          )}
        </div>
      </div>
    )
  }

  if (s.type === 'product-carousel') {
    return (
      <div className={`${compact ? 'w-32 h-14' : 'w-full max-w-md'} border border-linen bg-cream/40 p-2`}>
        {!compact && (
          <div className="text-[9px] uppercase tracking-[0.22em] text-terracotta">
            {c.eyebrow || 'Carrousel'}
          </div>
        )}
        <div className={`font-display leading-tight ${compact ? 'text-[10px] text-center' : 'text-sm mt-1'} truncate`}>
          {c.title || 'Carrousel produits'}
        </div>
        {!compact && (
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: 4 }).map((_, k) => (
              <div key={k} className="flex-1 aspect-[3/4] bg-linen/60" />
            ))}
          </div>
        )}
        {compact && (
          <div className="mt-1 flex gap-1">
            {Array.from({ length: 3 }).map((_, k) => (
              <div key={k} className="flex-1 h-3 bg-linen/60" />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (s.type === 'category-tiles') return badge('3 collections · grille')
  if (s.type === 'collections-themes') return badge('3 univers · détail')
  if (s.type === 'newsletter') return badge('Newsletter')

  return badge(s.type)
}


function SectionContentEditor({ type, content, onChange }) {
  if (type === 'editorial-banner') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Surtitre (petit texte)">
          <input
            value={content.eyebrow || ''}
            onChange={(e) => onChange('eyebrow', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Titre principal">
          <input
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-display text-lg"
          />
        </Field>
        <Field label="Bouton — libellé">
          <input
            value={content.ctaLabel || ''}
            onChange={(e) => onChange('ctaLabel', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Bouton — lien">
          <input
            value={content.ctaHref || ''}
            onChange={(e) => onChange('ctaHref', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm font-mono"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="Image (URL)">
            <ImageUploader
              images={content.image ? [content.image] : []}
              onChange={(imgs) => onChange('image', imgs[0] || '')}
            />
          </Field>
        </div>
        <Field label="Alignement">
          <select
            value={content.align || 'left'}
            onChange={(e) => onChange('align', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="left">Gauche</option>
            <option value="right">Droite</option>
          </select>
        </Field>
        <Field label="Hauteur">
          <select
            value={content.height || 'md'}
            onChange={(e) => onChange('height', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="sm">Petite</option>
            <option value="md">Moyenne</option>
            <option value="lg">Grande</option>
          </select>
        </Field>
      </div>
    )
  }

  if (type === 'product-carousel') {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Surtitre">
          <input
            value={content.eyebrow || ''}
            onChange={(e) => onChange('eyebrow', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        <Field label="Titre">
          <input
            value={content.title || ''}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink font-display text-lg"
          />
        </Field>
        <Field label="Filtre">
          <select
            value={content.filter || 'new'}
            onChange={(e) => onChange('filter', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          >
            <option value="new">Nouveautés</option>
            <option value="bestsellers">Meilleures ventes</option>
            <option value="limited">Éditions limitées</option>
            <option value="intemporels">Les Intemporels (tous)</option>
            <option value="classiques">Les Classiques (plaids · coussins · paniers · tapis · sets de table)</option>
            <option value="pe-2026-2027">Printemps/Été 2026-2027</option>
            <option value="all">Tous les produits</option>
          </select>
        </Field>
        <Field label="Description (facultatif — paragraphe sous le titre)">
          <textarea
            value={content.description || ''}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            placeholder="Un paragraphe élégant qui s'affiche sous le titre."
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm resize-none"
          />
        </Field>
        <Field label="Masquer les badges « Nouveau » / « Édition »">
          <label className="flex items-center gap-2 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={content.hideBadges === true}
              onChange={(e) => onChange('hideBadges', e.target.checked)}
              className="h-4 w-4 accent-emerald"
            />
            <span className="text-sm text-ink/70">Oui — pièces classiques, pas de badge</span>
          </label>
        </Field>
        <Field label="Lien &laquo; voir tout &raquo;">
          <input
            value={content.viewAllHref || ''}
            onChange={(e) => onChange('viewAllHref', e.target.value)}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink text-sm font-mono"
          />
        </Field>
        <Field label="Nombre de produits">
          <input
            type="number"
            min={2}
            max={20}
            value={content.limit || 8}
            onChange={(e) => onChange('limit', Number(e.target.value))}
            className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-ink"
          />
        </Field>
        {/* ---- Images personnalisées (mode "carrousel d'images") ---- */}
        <div className="md:col-span-2 mt-2 pt-6 border-t border-linen">
          <CarouselImageEditor
            images={Array.isArray(content.customImages) ? content.customImages : []}
            onChange={(next) => onChange('customImages', next)}
          />
        </div>
      </div>
    )
  }

  return null
}

export default HomeSectionsEditor
