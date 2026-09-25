'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Plus, Trash2, Copy, ArrowUp, ArrowDown, MousePointer, Move, Layers, Eye, EyeOff, X, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { sampleImageLuminance, pickTextColor } from '@/lib/color-utils'
import HeroFerm from '@/components/home/hero-ferm'

/**
 * Composeur Hero — V2
 * -------------------
 * Fonctions :
 *  1. Éditeur visuel WYSIWYG — glisser le bloc texte sur l'image
 *  2. Détection auto du contraste (blanc/noir en fonction de la luminosité)
 *  3. Compositions multiples (carrousel rotatif)
 *  4. Effet parallaxe togglable
 *
 * Props :
 *  - hero        : composition principale (rétro-compat)
 *  - heroSlides  : liste de compositions supplémentaires
 *  - rotationInterval : durée en ms entre chaque slide (défaut 5000)
 *  - onChange({ hero, heroSlides, rotationInterval })
 *  - ImageUploader : composant partagé injecté depuis /admin/page.js
 */
export default function HeroComposer({
  hero,
  heroSlides = [],
  rotationInterval = 5000,
  onChange,
  ImageUploader,
}) {
  // Toutes les slides : [hero, ...heroSlides]. On travaille sur cette liste
  // unifiée, puis on split au moment du save.
  const allSlides = useMemo(() => {
    const list = [hero || {}, ...(heroSlides || [])]
    return list
  }, [hero, heroSlides])

  const [activeIdx, setActiveIdx] = useState(0)
  const active = allSlides[activeIdx] || allSlides[0]

  const updateSlide = useCallback((idx, patch) => {
    const next = allSlides.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    // Split retour vers { hero, heroSlides }
    const [main, ...rest] = next
    onChange({ hero: main, heroSlides: rest, rotationInterval })
  }, [allSlides, onChange, rotationInterval])

  const updateField = useCallback((idx, path, value) => {
    const cur = allSlides[idx] || {}
    const next = structuredClone(cur)
    const parts = path.split('.')
    let ptr = next
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof ptr[parts[i]] !== 'object' || ptr[parts[i]] === null) ptr[parts[i]] = {}
      ptr = ptr[parts[i]]
    }
    ptr[parts[parts.length - 1]] = value
    updateSlide(idx, next)
  }, [allSlides, updateSlide])

  const addSlide = () => {
    const template = structuredClone(active || {})
    template.title = 'Nouvelle composition'
    const list = [...allSlides, template]
    const [main, ...rest] = list
    onChange({ hero: main, heroSlides: rest, rotationInterval })
    setActiveIdx(list.length - 1)
    toast.success('Composition ajoutée')
  }
  const duplicateSlide = (idx) => {
    const cloned = structuredClone(allSlides[idx])
    const list = [...allSlides]
    list.splice(idx + 1, 0, cloned)
    const [main, ...rest] = list
    onChange({ hero: main, heroSlides: rest, rotationInterval })
    setActiveIdx(idx + 1)
  }
  const removeSlide = (idx) => {
    if (allSlides.length <= 1) { toast.error('Il faut au moins une composition'); return }
    const list = allSlides.filter((_, i) => i !== idx)
    const [main, ...rest] = list
    onChange({ hero: main, heroSlides: rest, rotationInterval })
    setActiveIdx(Math.max(0, activeIdx - (idx <= activeIdx ? 1 : 0)))
  }
  const moveSlide = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= allSlides.length) return
    const list = [...allSlides]
    ;[list[idx], list[j]] = [list[j], list[idx]]
    const [main, ...rest] = list
    onChange({ hero: main, heroSlides: rest, rotationInterval })
    setActiveIdx(j)
  }

  return (
    <section id="admin-hero" className="border border-linen bg-ivory p-6 md:p-8 scroll-mt-24">
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald">Bannière principale · Compositeur V2</h3>
          <p className="text-xs text-ink/60 mt-2 max-w-xl">
            Glisse le bloc texte sur l'image, laisse la couleur s'ajuster automatiquement,
            active la parallaxe et crée plusieurs compositions pour un carrousel rotatif.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-ink/60">
          <Layers className="h-4 w-4" strokeWidth={1.5} />
          {allSlides.length} composition{allSlides.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Onglets slides */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {allSlides.map((s, i) => (
          <div key={i} className={`inline-flex items-center gap-1 border ${i === activeIdx ? 'border-emerald bg-emerald/5' : 'border-ink/15 bg-cream/40'} pl-3 pr-1 py-1.5 text-xs`}>
            <button onClick={() => setActiveIdx(i)} className={`${i === activeIdx ? 'text-emerald font-medium' : 'text-ink/70'}`}>
              #{i + 1} {s.title ? '· ' + s.title.split('\n')[0].slice(0, 22) : ''}
            </button>
            <button onClick={() => moveSlide(i, -1)} disabled={i === 0} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30" aria-label="Monter"><ArrowUp className="h-3 w-3" /></button>
            <button onClick={() => moveSlide(i, +1)} disabled={i === allSlides.length - 1} className="p-1 text-ink/40 hover:text-ink disabled:opacity-30" aria-label="Descendre"><ArrowDown className="h-3 w-3" /></button>
            <button onClick={() => duplicateSlide(i)} className="p-1 text-ink/40 hover:text-emerald" aria-label="Dupliquer"><Copy className="h-3 w-3" /></button>
            <button onClick={() => removeSlide(i)} disabled={allSlides.length <= 1} className="p-1 text-ink/40 hover:text-red-600 disabled:opacity-30" aria-label="Supprimer"><X className="h-3 w-3" /></button>
          </div>
        ))}
        <button onClick={addSlide} className="inline-flex items-center gap-2 border border-dashed border-emerald text-emerald px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] hover:bg-emerald hover:text-ivory transition">
          <Plus className="h-3.5 w-3.5" /> Ajouter
        </button>
      </div>

      {/* Paramètres du carrousel */}
      {allSlides.length >= 2 && (
        <div className="mb-6 border border-linen bg-cream/30 p-4 flex items-center gap-4 flex-wrap">
          <div className="text-[10px] uppercase tracking-[0.24em] text-ink/60">Carrousel actif</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-ink/50">Durée :</span>
            <input
              type="number"
              min={2000}
              max={30000}
              step={500}
              value={rotationInterval}
              onChange={(e) => onChange({ hero: allSlides[0], heroSlides: allSlides.slice(1), rotationInterval: Math.max(2000, Number(e.target.value) || 5000) })}
              className="w-24 bg-transparent border-b border-ink/20 py-1 focus:outline-none focus:border-emerald text-sm"
            />
            <span className="text-ink/50">ms</span>
          </div>
        </div>
      )}

      {/* Éditeur de la slide active */}
      <SlideEditor
        key={activeIdx}
        slide={active}
        onUpdate={(patch) => updateSlide(activeIdx, patch)}
        onUpdateField={(path, value) => updateField(activeIdx, path, value)}
        ImageUploader={ImageUploader}
      />
    </section>
  )
}

/* ============ ÉDITEUR D'UNE SLIDE UNIQUE ============ */
function SlideEditor({ slide, onUpdate, onUpdateField, ImageUploader }) {
  const s = slide || {}
  const layout = s.layout || 'full-image'
  const useCustom = !!s.useCustomPosition
  const coords = s.textCoords || { x: 8, y: 65 }
  const align = s.textAlign || 'left'
  const colorMode = s.textColorMode || 'auto'

  const imgRef = useRef(null)
  const stageRef = useRef(null)
  const [imgReady, setImgReady] = useState(false)
  const [dragging, setDragging] = useState(false)

  // === Détection auto du contraste ===
  const recomputeContrast = useCallback(() => {
    if (!imgRef.current || !imgReady) return
    const lum = sampleImageLuminance(imgRef.current, coords.x, coords.y, 30)
    const nextColor = pickTextColor(lum)
    if (nextColor !== s.heroTextColor) {
      onUpdateField('heroTextColor', nextColor)
    }
  }, [imgReady, coords.x, coords.y, onUpdateField, s.heroTextColor])

  // Recompute quand l'image est chargée ou coords changent
  useEffect(() => {
    if (colorMode === 'auto') recomputeContrast()
  }, [imgReady, coords.x, coords.y, colorMode, s.image, recomputeContrast])

  // === Drag & Drop du bloc texte ===
  const onPointerDown = (e) => {
    if (!useCustom) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e) => {
    if (!dragging || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    onUpdateField('textCoords', { x: Math.round(x), y: Math.round(y) })
  }
  const onPointerUp = (e) => {
    if (!dragging) return
    setDragging(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  // === Handlers ===
  const setLayout = (v) => onUpdateField('layout', v)
  const setTextPos = (v) => onUpdateField('textPosition', v)
  const setOverlay = (v) => onUpdateField('overlayIntensity', v)
  const toggleCustom = () => onUpdate({ useCustomPosition: !useCustom })
  const setAlign = (v) => onUpdateField('textAlign', v)
  const setColorMode = (v) => {
    onUpdateField('textColorMode', v)
    if (v !== 'auto') onUpdateField('heroTextColor', v)
  }

  const mediaUrl = s.image
  const isVideo = mediaUrl && (/\.(mp4|webm|mov)(\?.*)?$/i.test(mediaUrl) || (mediaUrl.includes('/api/file/') && /\.(mp4|webm|mov)/i.test(mediaUrl)))

  return (
    <div className="space-y-6">
      {/* Média */}
      <Field label="Média du hero (photo ou vidéo MP4)">
        <ImageUploader
          images={s.image ? [s.image] : []}
          onChange={(imgs) => onUpdateField('image', imgs[0] || '')}
          accept="all"
        />
        <p className="text-[11px] text-ink/50 italic mt-2">
          💡 Astuce : pour la mise en page « Image plein cadre », préférez une image horizontale (canapé beige, etc.).
        </p>
      </Field>

      {/* Mise en page & options globales */}
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Mise en page</label>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="w-full mt-1 bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald cursor-pointer"
          >
            <option value="full-image">Image plein cadre — texte superposé</option>
            <option value="split">Deux colonnes — texte à gauche, image à droite</option>
          </select>
        </div>
        {layout === 'full-image' && (
          <>
            {!useCustom && (
              <div>
                <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Position du texte</label>
                <select
                  value={s.textPosition || 'bottom-left'}
                  onChange={(e) => setTextPos(e.target.value)}
                  className="w-full mt-1 bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald cursor-pointer"
                >
                  <option value="bottom-left">En bas à gauche</option>
                  <option value="bottom-right">En bas à droite</option>
                  <option value="center">Centré</option>
                  <option value="top-left">En haut à gauche</option>
                  <option value="top-right">En haut à droite</option>
                </select>
              </div>
            )}
            <div>
              <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">
                Voile assombri ({s.overlayIntensity ?? 30}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={s.overlayIntensity ?? 30}
                onChange={(e) => setOverlay(Number(e.target.value))}
                className="w-full mt-2 accent-emerald"
              />
            </div>
          </>
        )}
      </div>

      {/* Options V2 */}
      {layout === 'full-image' && (
        <div className="border border-linen bg-cream/30 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <MousePointer className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-medium">Position exacte au pixel (WYSIWYG)</p>
                <p className="text-[11px] text-ink/50">Glisse le bloc texte à la souris directement sur l'aperçu.</p>
              </div>
            </div>
            <ToggleSwitch value={useCustom} onChange={toggleCustom} />
          </div>

          {useCustom && (
            <div className="grid md:grid-cols-3 gap-4 pt-2 border-t border-linen">
              <div>
                <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">X ({coords.x}%)</label>
                <input type="range" min={0} max={100} value={coords.x} onChange={(e) => onUpdateField('textCoords', { ...coords, x: Number(e.target.value) })} className="w-full mt-2 accent-emerald" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Y ({coords.y}%)</label>
                <input type="range" min={0} max={100} value={coords.y} onChange={(e) => onUpdateField('textCoords', { ...coords, y: Number(e.target.value) })} className="w-full mt-2 accent-emerald" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Alignement</label>
                <select value={align} onChange={(e) => setAlign(e.target.value)} className="w-full mt-1 bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald cursor-pointer">
                  <option value="left">Gauche</option>
                  <option value="center">Centre</option>
                  <option value="right">Droite</option>
                </select>
              </div>
            </div>
          )}

          {/* Couleur texte */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-linen">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-medium">Couleur du texte</p>
                <p className="text-[11px] text-ink/50">
                  Automatique = adapté à la luminosité de l'image (couleur détectée :
                  <span className={`ml-1 font-medium ${s.heroTextColor === 'black' ? 'text-ink' : 'text-emerald'}`}>
                    {s.heroTextColor === 'black' ? 'noir' : 'blanc'}
                  </span>).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 border border-ink/15 p-1">
              {[
                { v: 'auto',  label: 'Auto' },
                { v: 'white', label: 'Blanc' },
                { v: 'black', label: 'Noir' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setColorMode(opt.v)}
                  className={`px-3 py-1 text-[11px] uppercase tracking-[0.18em] transition ${
                    colorMode === opt.v ? 'bg-emerald text-ivory' : 'text-ink/60 hover:text-ink'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parallaxe */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-linen">
            <div className="flex items-center gap-3">
              <Move className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              <div>
                <p className="text-xs font-medium">Effet parallaxe au scroll</p>
                <p className="text-[11px] text-ink/50">L'image glisse légèrement pour donner de la profondeur.</p>
              </div>
            </div>
            <ToggleSwitch value={!!s.parallaxEnabled} onChange={() => onUpdateField('parallaxEnabled', !s.parallaxEnabled)} />
          </div>
          {s.parallaxEnabled && (
            <div>
              <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Intensité ({s.parallaxIntensity ?? 25}%)</label>
              <input type="range" min={5} max={60} value={s.parallaxIntensity ?? 25} onChange={(e) => onUpdateField('parallaxIntensity', Number(e.target.value))} className="w-full mt-2 accent-emerald" />
            </div>
          )}
        </div>
      )}

      {/* Aperçu WYSIWYG interactif */}
      {layout === 'full-image' && mediaUrl && (
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">
            Aperçu interactif {useCustom ? '— glisse le bloc' : '(active « Position exacte » pour glisser)'}
          </p>
          <div
            ref={stageRef}
            className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-cream overflow-hidden border border-linen select-none"
            style={{ cursor: useCustom && dragging ? 'grabbing' : useCustom ? 'crosshair' : 'default' }}
          >
            {isVideo ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                ref={imgRef}
                src={mediaUrl}
                muted
                loop
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                onLoadedData={() => setImgReady(true)}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={mediaUrl}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setImgReady(true)}
                draggable={false}
              />
            )}
            {/* Voile */}
            {(s.overlayIntensity ?? 30) > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: `linear-gradient(180deg, rgba(0,0,0,${((s.overlayIntensity ?? 30) / 100) * 0.3}) 0%, rgba(0,0,0,${(s.overlayIntensity ?? 30) / 100}) 100%)`,
                }}
              />
            )}
            {/* Bloc texte draggable */}
            <DraggableTextBlock
              slide={s}
              coords={coords}
              align={align}
              useCustom={useCustom}
              dragging={dragging}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>
        </div>
      )}

      {/* Champs textuels — comme avant */}
      <div className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-3">
          Éléments — coche ce que tu veux afficher, clique sur × pour vider un champ
        </p>

        <ElementRow show={s.showEyebrow !== false} onToggle={(v) => onUpdateField('showEyebrow', v)} label="Surtitre" onClear={() => onUpdateField('eyebrow', '')}>
          <input value={s.eyebrow || ''} onChange={(e) => onUpdateField('eyebrow', e.target.value)} placeholder="Nouvelle Collection · Automne-Hiver 2025" className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm" />
        </ElementRow>

        <ElementRow show={s.showTitle !== false} onToggle={(v) => onUpdateField('showTitle', v)} label="Titre principal" onClear={() => onUpdateField('title', '')}>
          <textarea rows={2} value={s.title || ''} onChange={(e) => onUpdateField('title', e.target.value)} placeholder="L'art discret&#10;de la maison." className="w-full bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-emerald font-display text-lg" />
          <p className="text-[10px] text-ink/40 mt-1">Retour à la ligne = nouveau paragraphe</p>
        </ElementRow>

        <ElementRow show={s.showSubtitle !== false} onToggle={(v) => onUpdateField('showSubtitle', v)} label="Sous-titre" onClear={() => onUpdateField('subtitle', '')}>
          <textarea rows={2} value={s.subtitle || ''} onChange={(e) => onUpdateField('subtitle', e.target.value)} placeholder="Plaids crochet, macramé mural..." className="w-full bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-emerald text-sm" />
        </ElementRow>

        <ElementRow show={s.showPrimary !== false} onToggle={(v) => onUpdateField('showPrimary', v)} label="Bouton principal" onClear={() => { onUpdateField('ctaPrimary.label', ''); onUpdateField('ctaPrimary.href', '') }}>
          <div className="grid grid-cols-2 gap-3">
            <input value={s.ctaPrimary?.label || ''} onChange={(e) => onUpdateField('ctaPrimary.label', e.target.value)} placeholder="Libellé" className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm" />
            <input value={s.ctaPrimary?.href || ''} onChange={(e) => onUpdateField('ctaPrimary.href', e.target.value)} placeholder="/collections" className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm font-mono" />
          </div>
        </ElementRow>

        <ElementRow show={s.showSecondary !== false} onToggle={(v) => onUpdateField('showSecondary', v)} label="Bouton secondaire" onClear={() => { onUpdateField('ctaSecondary.label', ''); onUpdateField('ctaSecondary.href', '') }}>
          <div className="grid grid-cols-2 gap-3">
            <input value={s.ctaSecondary?.label || ''} onChange={(e) => onUpdateField('ctaSecondary.label', e.target.value)} placeholder="Libellé" className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm" />
            <input value={s.ctaSecondary?.href || ''} onChange={(e) => onUpdateField('ctaSecondary.href', e.target.value)} placeholder="/atelier" className="bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm font-mono" />
          </div>
        </ElementRow>

        <ElementRow show={s.showSignature !== false} onToggle={(v) => onUpdateField('showSignature', v)} label="Étiquette signature" onClear={() => onUpdateField('signature', '')}>
          <input value={s.signature || ''} onChange={(e) => onUpdateField('signature', e.target.value)} placeholder="Plaid Sylvestre · Crochet main" className="w-full bg-transparent border-b border-ink/20 py-2 focus:outline-none focus:border-emerald text-sm" />
        </ElementRow>
      </div>
    </div>
  )
}

/* ============ HELPERS ============ */

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.24em] text-ink/50 block mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition ${value ? 'bg-emerald' : 'bg-ink/20'}`}
      aria-pressed={value}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-ivory rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function ElementRow({ show, onToggle, label, onClear, children }) {
  return (
    <div className={`flex items-start gap-3 border-l-2 pl-4 py-2 transition ${show ? 'border-emerald' : 'border-ink/10'}`}>
      <label className="flex items-center gap-2 min-w-[180px] pt-2 cursor-pointer select-none">
        <input type="checkbox" checked={show} onChange={(e) => onToggle(e.target.checked)} className="accent-emerald w-4 h-4" />
        <span className={`text-[10px] uppercase tracking-[0.24em] ${show ? 'text-emerald' : 'text-ink/40'}`}>{label}</span>
      </label>
      <div className={`flex-1 ${show ? '' : 'opacity-40 pointer-events-none'}`}>{children}</div>
      <button onClick={onClear} title="Vider" className="text-ink/30 hover:text-red-600 p-2 shrink-0" aria-label={`Vider ${label}`}>
        <Trash2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
    </div>
  )
}

/**
 * Bloc texte draggable qui reflète en direct la config de la slide.
 */
function DraggableTextBlock({ slide, coords, align, useCustom, dragging, onPointerDown, onPointerMove, onPointerUp }) {
  const s = slide || {}
  const color = s.textColorMode === 'auto' ? (s.heroTextColor || 'white') : s.textColorMode
  const isDark = color === 'black'
  const style = useCustom
    ? {
        position: 'absolute',
        left: `${coords.x}%`,
        top: `${coords.y}%`,
        transform: `translate(${align === 'right' ? '-100%' : align === 'center' ? '-50%' : '0'}, -50%)`,
        maxWidth: '640px',
        width: 'min(90%, 640px)',
        textAlign: align,
      }
    : (() => {
        const pos = s.textPosition || 'bottom-left'
        const posMap = {
          center:       { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' },
          'bottom-left':{ bottom: '8%', left: '5%', textAlign: 'left' },
          'bottom-right':{ bottom: '8%', right: '5%', textAlign: 'right' },
          'top-left':   { top: '8%',  left: '5%',  textAlign: 'left' },
          'top-right':  { top: '8%',  right: '5%', textAlign: 'right' },
        }
        return { position: 'absolute', ...posMap[pos], maxWidth: '640px', width: 'min(90%, 640px)' }
      })()

  return (
    <div
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`${useCustom ? 'cursor-grab active:cursor-grabbing' : ''} ${dragging ? 'ring-2 ring-emerald ring-offset-2 ring-offset-black/30' : ''}`}
    >
      {s.showEyebrow !== false && s.eyebrow && (
        <span className={`block text-[10px] md:text-[11px] uppercase tracking-[0.42em] mb-3 ${isDark ? 'text-ink/70' : 'text-ivory/90'}`}>
          {s.eyebrow}
        </span>
      )}
      {s.showTitle !== false && s.title && (
        <h2
          className={`whitespace-pre-line text-3xl md:text-5xl lg:text-6xl leading-[1] ${isDark ? 'text-ink' : 'text-ivory'}`}
          style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
        >
          {s.title}
        </h2>
      )}
      {s.showSubtitle !== false && s.subtitle && (
        <p className={`mt-3 md:mt-4 text-sm md:text-base leading-relaxed max-w-xl ${isDark ? 'text-ink/70' : 'text-ivory/85'}`}>
          {s.subtitle}
        </p>
      )}
      {((s.showPrimary !== false && s.ctaPrimary?.label) || (s.showSecondary !== false && s.ctaSecondary?.label)) && (
        <div className={`mt-4 md:mt-6 flex flex-wrap gap-3 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
          {s.showPrimary !== false && s.ctaPrimary?.label && (
            <span className="bg-emerald text-ivory px-5 py-2.5 text-[11px] uppercase tracking-[0.32em] inline-block">{s.ctaPrimary.label}</span>
          )}
          {s.showSecondary !== false && s.ctaSecondary?.label && (
            <span className={`px-5 py-2.5 text-[11px] uppercase tracking-[0.32em] border inline-block ${isDark ? 'border-ink text-ink' : 'border-ivory text-ivory'}`}>
              {s.ctaSecondary.label}
            </span>
          )}
        </div>
      )}
      {useCustom && (
        <div className="absolute -top-6 left-0 bg-emerald text-ivory text-[9px] px-2 py-0.5 uppercase tracking-[0.2em] pointer-events-none rounded-sm">
          Glisse-moi
        </div>
      )}
    </div>
  )
}
