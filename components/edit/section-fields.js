'use client'

/**
 * Champs d'édition d'une section de la page d'accueil — PARTAGÉS entre :
 *   - le mode édition visuel (/?edit=1) → panneau latéral SectionEditorPanel
 *   - l'admin (/admin → Éditeur de l'accueil) → HomeSectionsEditor
 * Ainsi l'administratrice retrouve exactement les mêmes fonctions partout.
 */
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Search, Plus, Check, ShoppingBag, Wand2, Hand, ArrowUp, ArrowDown } from 'lucide-react'
import { CAROUSEL_FILTERS, getCarouselMode, filterProductsForCarousel } from '@/lib/homepage-sections'

export const INPUT_CLS =
  'w-full bg-ivory border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald transition rounded-sm'
export const LABEL_CLS = 'block text-[10px] uppercase tracking-[0.26em] text-ink/70 mb-2'

/* ----------------------------- Catalogue (cache) ----------------------------- */

let productsPromise = null
function loadAllProducts(force = false) {
  if (!productsPromise || force) {
    productsPromise = fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => d.products || [])
      .catch(() => {
        productsPromise = null
        return []
      })
  }
  return productsPromise
}

export function useAllProducts() {
  const [list, setList] = useState(null)
  useEffect(() => {
    let alive = true
    loadAllProducts().then((l) => alive && setList(l))
    return () => { alive = false }
  }, [])
  return list
}

const fmtPrice = (n) => `${Number(n || 0).toFixed(2).replace('.', ',')} €`

/* ------------------------------- Champs ------------------------------- */

export default function SectionFields({ section, updateContent }) {
  const c = section?.content || {}
  const t = section?.type

  if (t === 'hero') {
    return (
      <div className="space-y-5">
        <Field label="Image ou vidéo d'arrière-plan">
          <ImageField value={c.image || ''} onChange={(v) => updateContent({ image: v })} />
          <p className="text-[10px] text-ink/50 mt-1 uppercase tracking-[0.22em]">
            Image JPG/PNG/WebP ou vidéo MP4 — fonctionne aussi avec les URL /api/img/… et /api/file/…
          </p>
        </Field>
        <Field label="Petit texte (sur-titre)">
          <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} placeholder="Nouvelle collection" />
        </Field>
        <Field label="Grand titre (saut de ligne autorisé)">
          <textarea className={`${INPUT_CLS} min-h-[100px]`} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} placeholder={"L'art discret\u000Ade la maison."} />
        </Field>
        <Field label="Sous-titre">
          <textarea className={`${INPUT_CLS} min-h-[90px]`} value={c.subtitle || ''} onChange={(e) => updateContent({ subtitle: e.target.value })} placeholder="Plaids crochet, macramé mural…" />
        </Field>
        <Field label="Signature discrète (bas de visuel)">
          <input className={INPUT_CLS} value={c.signature || ''} onChange={(e) => updateContent({ signature: e.target.value })} placeholder="Plaid Sylvestre · Crochet main" />
        </Field>

        <div className="pt-2 border-t border-linen">
          <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-3">Bouton principal</div>
          <Field label="Texte">
            <input className={INPUT_CLS} value={c.ctaPrimary?.label || ''} onChange={(e) => updateContent({ ctaPrimary: { ...(c.ctaPrimary || {}), label: e.target.value } })} placeholder="Découvrir la collection" />
          </Field>
          <div className="h-3" />
          <Field label="Lien">
            <input className={INPUT_CLS} value={c.ctaPrimary?.href || ''} onChange={(e) => updateContent({ ctaPrimary: { ...(c.ctaPrimary || {}), href: e.target.value } })} placeholder="/collections?cat=nouveautes" />
          </Field>
        </div>

        <div className="pt-2 border-t border-linen">
          <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-3">Bouton secondaire</div>
          <Field label="Texte">
            <input className={INPUT_CLS} value={c.ctaSecondary?.label || ''} onChange={(e) => updateContent({ ctaSecondary: { ...(c.ctaSecondary || {}), label: e.target.value } })} placeholder="Notre atelier" />
          </Field>
          <div className="h-3" />
          <Field label="Lien">
            <input className={INPUT_CLS} value={c.ctaSecondary?.href || ''} onChange={(e) => updateContent({ ctaSecondary: { ...(c.ctaSecondary || {}), href: e.target.value } })} placeholder="/a-propos" />
          </Field>
        </div>

        <div className="pt-2 border-t border-linen">
          <Field label="Position du texte">
            <Segmented
              value={c.textPosition || 'bottom-left'}
              onChange={(v) => updateContent({ textPosition: v })}
              options={[
                { v: 'top-left', label: '↖' },
                { v: 'top-right', label: '↗' },
                { v: 'center', label: '✦' },
                { v: 'bottom-left', label: '↙' },
                { v: 'bottom-right', label: '↘' },
              ]}
            />
          </Field>
          <div className="h-3" />
          <Field label="Intensité du voile sombre">
            <input type="range" min="0" max="100" step="5" value={c.overlayIntensity ?? 30} onChange={(e) => updateContent({ overlayIntensity: Number(e.target.value) })} className="w-full accent-emerald" />
            <div className="text-[10px] text-ink/50 mt-1">{c.overlayIntensity ?? 30}% d'opacité</div>
          </Field>
        </div>

        <div className="pt-2 border-t border-linen">
          <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-3">Afficher / Masquer</div>
          <ToggleRow label="Petit texte" value={c.showEyebrow !== false} onChange={(v) => updateContent({ showEyebrow: v })} />
          <ToggleRow label="Grand titre" value={c.showTitle !== false} onChange={(v) => updateContent({ showTitle: v })} />
          <ToggleRow label="Sous-titre" value={c.showSubtitle !== false} onChange={(v) => updateContent({ showSubtitle: v })} />
          <ToggleRow label="Bouton principal" value={c.showPrimary !== false} onChange={(v) => updateContent({ showPrimary: v })} />
          <ToggleRow label="Bouton secondaire" value={c.showSecondary !== false} onChange={(v) => updateContent({ showSecondary: v })} />
          <ToggleRow label="Signature" value={c.showSignature !== false} onChange={(v) => updateContent({ showSignature: v })} />
        </div>
      </div>
    )
  }

  if (t === 'newsletter') {
    return (
      <div className="space-y-5">
        <Field label="Petit texte (sur-titre)">
          <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} placeholder="Le journal" />
        </Field>
        <Field label="Grand titre">
          <textarea className={`${INPUT_CLS} min-h-[80px]`} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} placeholder="Recevez les nouveautés avant tout le monde." />
        </Field>
        <Field label="Texte sous le titre">
          <textarea className={`${INPUT_CLS} min-h-[70px]`} value={c.description || ''} onChange={(e) => updateContent({ description: e.target.value })} placeholder="Un mail rare et soigné." />
        </Field>
        <Field label="Texte dans le champ email">
          <input className={INPUT_CLS} value={c.placeholder || ''} onChange={(e) => updateContent({ placeholder: e.target.value })} placeholder="Votre adresse email" />
        </Field>
        <Field label="Texte du bouton">
          <input className={INPUT_CLS} value={c.buttonLabel || ''} onChange={(e) => updateContent({ buttonLabel: e.target.value })} placeholder="S'inscrire" />
        </Field>
      </div>
    )
  }

  if (t === 'editorial-banner') {
    return (
      <div className="space-y-5">
        <Field label="Petit texte (sur-titre)">
          <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} placeholder="Nouvelle collection" />
        </Field>
        <Field label="Grand titre">
          <textarea className={`${INPUT_CLS} min-h-[80px]`} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} placeholder="Automne-Hiver 2026" />
        </Field>
        <Field label="Image">
          <ImageField value={c.image || ''} onChange={(v) => updateContent({ image: v })} />
        </Field>
        <Field label="Texte du bouton">
          <input className={INPUT_CLS} value={c.ctaLabel || ''} onChange={(e) => updateContent({ ctaLabel: e.target.value })} placeholder="Découvrir" />
        </Field>
        <Field label="Lien du bouton">
          <input className={INPUT_CLS} value={c.ctaHref || ''} onChange={(e) => updateContent({ ctaHref: e.target.value })} placeholder="/collections" />
        </Field>
        <Field label="Position du texte">
          <Segmented
            value={c.align || 'left'}
            onChange={(v) => updateContent({ align: v })}
            options={[
              { v: 'left', label: 'Gauche' },
              { v: 'center', label: 'Centre' },
              { v: 'right', label: 'Droite' },
            ]}
          />
        </Field>
        <Field label="Hauteur">
          <Segmented
            value={c.height || 'md'}
            onChange={(v) => updateContent({ height: v })}
            options={[
              { v: 'sm', label: 'Petite' },
              { v: 'md', label: 'Moyenne' },
              { v: 'lg', label: 'Grande' },
            ]}
          />
        </Field>
        <Field label="Teinte du voile">
          <Segmented
            value={c.overlay || 'dark'}
            onChange={(v) => updateContent({ overlay: v })}
            options={[
              { v: 'dark', label: 'Sombre' },
              { v: 'light', label: 'Claire' },
            ]}
          />
        </Field>
      </div>
    )
  }

  if (t === 'product-carousel') {
    return (
      <div className="space-y-5">
        <Field label="Petit texte (sur-titre)">
          <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Grand titre">
          <input className={INPUT_CLS} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} />
        </Field>
        <Field label="Paragraphe sous le titre (facultatif)">
          <textarea
            className={`${INPUT_CLS} min-h-[90px]`}
            value={c.description || ''}
            onChange={(e) => updateContent({ description: e.target.value })}
            placeholder="Petit texte élégant qui s'affiche entre le titre et les produits."
          />
        </Field>
        <Field label="Lien « Tout voir » (facultatif)">
          <input className={INPUT_CLS} value={c.viewAllHref || ''} onChange={(e) => updateContent({ viewAllHref: e.target.value })} placeholder="/collections" />
        </Field>
        <label className="flex items-center gap-2 py-1 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={c.hideBadges === true}
            onChange={(e) => updateContent({ hideBadges: e.target.checked })}
            className="h-4 w-4 accent-emerald"
          />
          <span className="text-sm text-ink/70">Masquer les badges Nouveau / Édition sur les photos</span>
        </label>

        <ProductSourceEditor content={c} updateContent={updateContent} />
      </div>
    )
  }

  if (t === 'lifestyle' || t === 'iconic-plaid') {
    return (
      <div className="space-y-5">
        <Field label="Petit texte (sur-titre)">
          <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} />
        </Field>
        <Field label="Grand titre">
          <input className={INPUT_CLS} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} />
        </Field>
      </div>
    )
  }

  return (
    <div className="bg-cream/40 border border-linen p-4 text-sm text-ink/70 leading-relaxed">
      Cette section se remplit automatiquement à partir de vos collections. Vous pouvez la déplacer, l'afficher ou la masquer.
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/*  Source des produits d'un carrousel — Automatique OU Je choisis        */
/* ---------------------------------------------------------------------- */

export function ProductSourceEditor({ content, updateContent }) {
  const c = content || {}
  const mode = getCarouselMode(c)
  const picked = Array.isArray(c.pickedProducts) ? c.pickedProducts : []
  const all = useAllProducts()
  const filter = c.filter || 'all'
  const limit = Number(c.limit) || 8
  const autoList = useMemo(
    () => (all ? filterProductsForCarousel(all, filter).slice(0, limit) : []),
    [all, filter, limit]
  )

  return (
    <div className="pt-5 border-t border-linen" data-testid="product-source-editor">
      <span className={LABEL_CLS}>Produits affichés dans ce carrousel</span>
      <div className="grid grid-cols-2 gap-2 mb-4" role="radiogroup" aria-label="Choix des produits">
        <ModeCard
          active={mode === 'auto'}
          onClick={() => updateContent({ selectionMode: 'auto' })}
          icon={Wand2}
          title="Automatique"
          text="Par catégorie, mis à jour tout seul"
          testId="carousel-mode-auto"
        />
        <ModeCard
          active={mode === 'manual'}
          onClick={() => updateContent({ selectionMode: 'manual' })}
          icon={Hand}
          title="Je choisis"
          text="Vos produits, dans votre ordre"
          testId="carousel-mode-manual"
        />
      </div>

      {mode === 'auto' ? (
        <div className="space-y-4">
          <Field label="Catégorie à afficher">
            <div className="grid grid-cols-2 gap-1.5">
              {CAROUSEL_FILTERS.map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => updateContent({ filter: f.v })}
                  title={f.hint}
                  className={`min-h-[44px] px-3 py-2 text-left text-[12px] leading-tight border rounded-sm transition ${
                    filter === f.v ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink/75 hover:border-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Nombre maximum de produits">
            <input type="number" min={2} max={20} className={INPUT_CLS} value={limit} onChange={(e) => updateContent({ limit: Number(e.target.value) })} />
          </Field>
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-ink/55 mb-2">
              Aperçu : {all ? `${autoList.length} produit${autoList.length > 1 ? 's' : ''}` : 'chargement…'}
            </div>
            {autoList.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {autoList.map((p) => (
                  <div key={p.slug} className="h-14 w-14 flex-none bg-cream overflow-hidden rounded-sm border border-linen" title={`${p.name} — ${fmtPrice(p.price)}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <PickedProductsManager
          picked={picked}
          onChange={(next) => updateContent({ pickedProducts: next, selectionMode: 'manual' })}
          autoSuggestion={autoList.map((p) => p.slug)}
        />
      )}
    </div>
  )
}

function ModeCard({ active, onClick, icon: Icon, title, text, testId }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      data-testid={testId}
      className={`text-left p-3 border rounded-sm transition min-h-[72px] ${
        active ? 'border-emerald bg-emerald/5 ring-1 ring-emerald' : 'border-ink/15 hover:border-ink/40'
      }`}
    >
      <div className={`flex items-center gap-2 text-sm font-medium ${active ? 'text-emerald' : 'text-ink'}`}>
        <Icon className="h-4 w-4" strokeWidth={1.6} />
        {title}
      </div>
      <div className="text-[11px] text-ink/55 mt-1 leading-snug">{text}</div>
    </button>
  )
}

/* ---------------------------------------------------------------------- */
/*  PickedProductsManager — vrais produits (prix + couleurs + fiche)       */
/* ---------------------------------------------------------------------- */

export function PickedProductsManager({ picked, onChange, autoSuggestion = [] }) {
  const [openModal, setOpenModal] = useState(false)
  const all = useAllProducts()
  const map = useMemo(() => new Map((all || []).map((p) => [p.slug, p])), [all])
  const pickedDetails = picked.map((slug) => map.get(slug)).filter(Boolean)

  const removeAt = (slug) => onChange(picked.filter((s) => s !== slug))
  const move = (slug, dir) => {
    const i = picked.indexOf(slug)
    const j = i + dir
    if (i < 0 || j < 0 || j >= picked.length) return
    const next = picked.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div data-testid="picked-products-manager">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.22em] text-ink/60">
          Produits choisis ({pickedDetails.length})
        </span>
      </div>
      <p className="text-xs text-ink/55 leading-relaxed mb-3">
        Chaque produit s'affiche avec sa photo, son prix et ses couleurs, et ouvre sa fiche produit au clic.
        {picked.length === 0 && ' Tant qu\'aucun produit n\'est choisi, la sélection automatique reste affichée sur le site.'}
      </p>

      {!all && picked.length > 0 && <div className="text-xs text-ink/50 mb-2">Chargement…</div>}

      {pickedDetails.length > 0 && (
        <ul className="space-y-2 mb-3">
          {pickedDetails.map((p, i) => (
            <li key={p.slug} className="flex items-center gap-3 border border-linen bg-ivory p-2 rounded-sm" data-testid={`picked-item-${p.slug}`}>
              <span className="w-5 text-center text-[11px] tabular-nums text-emerald font-semibold">{i + 1}</span>
              <div className="h-14 w-14 flex-none bg-cream overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-ink/60 tabular-nums">{fmtPrice(p.price)}</div>
                {p.variants?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {p.variants.slice(0, 6).map((v, k) => (
                      <span key={k} className="h-3 w-3 rounded-full border border-ink/15" style={{ background: v.hex || '#eee' }} title={v.name} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => move(p.slug, -1)} disabled={i === 0} className="h-8 w-8 flex items-center justify-center border border-ink/10 hover:border-ink rounded-sm disabled:opacity-30" aria-label="Monter">
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button type="button" onClick={() => move(p.slug, 1)} disabled={i === pickedDetails.length - 1} className="h-8 w-8 flex items-center justify-center border border-ink/10 hover:border-ink rounded-sm disabled:opacity-30" aria-label="Descendre">
                  <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
              </div>
              <button type="button" onClick={() => removeAt(p.slug)} className="h-10 w-10 flex items-center justify-center bg-ink/5 hover:bg-brique hover:text-ivory rounded-sm" aria-label={`Retirer ${p.name}`}>
                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpenModal(true)}
        data-testid="open-product-picker"
        className="w-full h-12 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] bg-ink text-ivory hover:bg-emerald transition rounded-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} />
        {picked.length ? 'Ajouter / retirer des produits' : 'Choisir les produits'}
      </button>

      {picked.length === 0 && autoSuggestion.length > 0 && (
        <button
          type="button"
          onClick={() => onChange(autoSuggestion)}
          className="mt-2 w-full h-11 text-[11px] uppercase tracking-[0.2em] border border-ink/20 hover:border-emerald hover:text-emerald transition rounded-sm"
        >
          Partir des {autoSuggestion.length} produits actuels
        </button>
      )}

      {openModal && (
        <ProductPickerModal
          picked={picked}
          products={all || []}
          onClose={() => setOpenModal(false)}
          onConfirm={(next) => { onChange(next); setOpenModal(false) }}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/*  Modal de sélection de produits — recherche + catégories               */
/* ---------------------------------------------------------------------- */

const CATEGORY_LABELS = {
  intemporels: 'Intemporels',
  'pe-2026-2027': 'Printemps / Été 26-27',
}

function ProductPickerModal({ picked, products, onClose, onConfirm }) {
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState(() => new Set(picked))
  const all = products || []
  const categories = Array.from(new Set(all.map((p) => p.category))).filter(Boolean)

  const q = query.toLowerCase().trim()
  const filtered = all.filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false
    if (!q) return true
    return ((p.name || '') + ' ' + (p.material || '') + ' ' + (p.color || '')).toLowerCase().includes(q)
  })

  const toggle = (slug) => {
    const next = new Set(selected)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSelected(next)
  }

  const confirm = () => {
    // Garde l'ordre existant, ajoute les nouveaux à la fin
    const existing = picked.filter((s) => selected.has(s))
    const additions = Array.from(selected).filter((s) => !picked.includes(s))
    onConfirm([...existing, ...additions])
  }

  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-stretch md:items-center justify-center bg-ink/60 p-0 md:p-6" data-testid="product-picker-modal">
      <div
        className="bg-ivory w-full md:max-w-2xl md:h-[80vh] md:rounded-sm flex flex-col shadow-2xl"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', height: '100dvh', maxHeight: '100dvh' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-linen">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Vitrine</div>
            <div className="font-display text-xl">Choisissez les produits</div>
          </div>
          <button onClick={onClose} className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm" aria-label="Fermer">
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-linen space-y-3">
          <div className="flex items-center gap-2 border border-ink/15 bg-ivory px-3">
            <Search className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit…" className="flex-1 bg-transparent text-sm outline-none py-2.5" />
          </div>
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
              <PickChip label="Tous" active={cat === 'all'} onClick={() => setCat('all')} />
              {categories.map((c) => (
                <PickChip key={c} label={CATEGORY_LABELS[c] || c} active={cat === c} onClick={() => setCat(c)} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {all.length === 0 ? (
            <div className="text-sm text-ink/50 text-center py-10">Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-ink/50 text-center py-10">Aucun produit ne correspond.</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((p) => {
                const isSelected = selected.has(p.slug)
                return (
                  <li key={p.slug}>
                    <button
                      type="button"
                      onClick={() => toggle(p.slug)}
                      data-testid={`pick-${p.slug}`}
                      className={`w-full text-left flex items-center gap-3 p-2 border transition rounded-sm ${isSelected ? 'border-emerald bg-emerald/5' : 'border-linen hover:border-ink/30'}`}
                    >
                      <div className="h-16 w-16 flex-none bg-cream overflow-hidden rounded-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-ink/60 tabular-nums">{fmtPrice(p.price)}</div>
                        {p.variants?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {p.variants.slice(0, 5).map((v, i) => (
                              <span key={i} className="h-3 w-3 rounded-full border border-ink/15" style={{ background: v.hex || '#eee' }} title={v.name} />
                            ))}
                          </div>
                        )}
                      </div>
                      <span className={`h-6 w-6 flex-none rounded-full border-2 flex items-center justify-center transition ${isSelected ? 'bg-emerald border-emerald text-ivory' : 'border-ink/20'}`}>
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="px-5 py-4 border-t border-linen flex items-center gap-3 bg-ivory">
          <div className="flex-1 text-sm">
            <strong className="tabular-nums">{selected.size}</strong>{' '}
            <span className="text-ink/60">produit{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}</span>
          </div>
          <button onClick={onClose} className="h-11 px-4 text-[11px] uppercase tracking-[0.22em] border border-ink/20 hover:border-ink rounded-sm">
            Annuler
          </button>
          <button onClick={confirm} data-testid="confirm-product-picker" className="h-11 px-5 bg-ink text-ivory text-[11px] uppercase tracking-[0.22em] hover:bg-emerald rounded-sm flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
            Valider
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PickChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-none px-3 h-9 text-[10px] uppercase tracking-[0.22em] border rounded-sm transition ${active ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink/70 hover:border-ink'}`}
    >
      {label}
    </button>
  )
}

/* ------------------------------- Helpers UI ------------------------------- */

export function Field({ label, children }) {
  return (
    <div className="block">
      <span className={LABEL_CLS}>{label}</span>
      {children}
    </div>
  )
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 p-1 bg-cream rounded-sm">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 h-10 text-[11px] uppercase tracking-[0.2em] rounded-sm transition ${value === o.v ? 'bg-ink text-ivory' : 'text-ink/60 hover:text-ink'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ToggleRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 select-none">
      <span className="text-sm text-ink/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-emerald' : 'bg-ink/20'}`}
        aria-pressed={value}
        aria-label={label}
      >
        <span className={`absolute top-0.5 h-5 w-5 bg-ivory rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export function ImageField({ value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function upload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setErr('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
      const d = await r.json()
      if (!r.ok || !d.url) throw new Error(d.error || 'Échec')
      onChange(d.url)
    } catch (e) {
      setErr(e.message || 'Erreur import')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative aspect-[16/9] bg-cream border border-linen overflow-hidden rounded-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="aperçu" className="w-full h-full object-cover" />
          <button type="button" onClick={() => onChange('')} className="absolute top-2 right-2 h-9 w-9 flex items-center justify-center bg-ink/80 text-ivory hover:bg-terracotta rounded-sm" aria-label="Retirer l'image">
            <Trash2 className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      ) : null}
      <input className={INPUT_CLS} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="https://… ou /api/img/…" />
      <label className="block cursor-pointer">
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={upload} disabled={busy} />
        <span className={`block w-full h-11 flex items-center justify-center text-[11px] uppercase tracking-[0.22em] border border-ink/20 hover:border-emerald transition rounded-sm ${busy ? 'opacity-50' : ''}`}>
          {busy ? 'Import en cours…' : 'Importer depuis l\'iPad'}
        </span>
      </label>
      {err && <p className="text-xs text-terracotta">{err}</p>}
    </div>
  )
}
