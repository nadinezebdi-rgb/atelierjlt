'use client'

/**
 * Panneau latéral d'édition d'une section.
 *   - Mobile/iPad : plein écran, slide depuis la droite
 *   - Desktop : panneau 420px flottant à droite
 *
 * Champs supportés selon le type de section :
 *   - editorial-banner   : eyebrow, title, image, cta, align
 *   - product-carousel   : eyebrow, title, filter, limit, customImages
 *   - category-tiles     : (contenu géré via section "Collections")
 *   - collections-themes : idem
 *   - lifestyle          : eyebrow, title
 *   - iconic-plaid       : eyebrow, title
 */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Eye, EyeOff, ExternalLink, Trash2, Search, Plus, Check, ShoppingBag } from 'lucide-react'

const INPUT_CLS =
  'w-full bg-ivory border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald transition rounded-sm'
const LABEL_CLS = 'block text-[10px] uppercase tracking-[0.26em] text-ink/70 mb-2'

export default function SectionEditorPanel({ section, onClose, onChange, onToggle }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  if (!mounted || typeof document === 'undefined') return null

  const c = section.content || {}
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

        {/* Fields */}
        <div className="p-5 space-y-5">
          {section.type === 'hero' && (
            <>
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
                  <input
                    className={INPUT_CLS}
                    value={c.ctaPrimary?.label || ''}
                    onChange={(e) => updateContent({ ctaPrimary: { ...(c.ctaPrimary || {}), label: e.target.value } })}
                    placeholder="Découvrir la collection"
                  />
                </Field>
                <div className="h-3" />
                <Field label="Lien">
                  <input
                    className={INPUT_CLS}
                    value={c.ctaPrimary?.href || ''}
                    onChange={(e) => updateContent({ ctaPrimary: { ...(c.ctaPrimary || {}), href: e.target.value } })}
                    placeholder="/collections?cat=nouveautes"
                  />
                </Field>
              </div>

              <div className="pt-2 border-t border-linen">
                <div className="text-[10px] uppercase tracking-[0.28em] text-ink/60 mb-3">Bouton secondaire</div>
                <Field label="Texte">
                  <input
                    className={INPUT_CLS}
                    value={c.ctaSecondary?.label || ''}
                    onChange={(e) => updateContent({ ctaSecondary: { ...(c.ctaSecondary || {}), label: e.target.value } })}
                    placeholder="Notre atelier"
                  />
                </Field>
                <div className="h-3" />
                <Field label="Lien">
                  <input
                    className={INPUT_CLS}
                    value={c.ctaSecondary?.href || ''}
                    onChange={(e) => updateContent({ ctaSecondary: { ...(c.ctaSecondary || {}), href: e.target.value } })}
                    placeholder="/a-propos"
                  />
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
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={c.overlayIntensity ?? 30}
                    onChange={(e) => updateContent({ overlayIntensity: Number(e.target.value) })}
                    className="w-full accent-emerald"
                  />
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
            </>
          )}

          {section.type === 'newsletter' && (
            <>
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
            </>
          )}

          {section.type === 'editorial-banner' && (
            <>
              <Field label="Petit texte (sur-titre)">
                <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} placeholder="Nouvelle collection" />
              </Field>
              <Field label="Grand titre">
                <textarea className={`${INPUT_CLS} min-h-[80px]`} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} placeholder="Automne-Hiver 2026" />
              </Field>
              <Field label="Image (URL ou /api/img/...)">
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
            </>
          )}

          {section.type === 'product-carousel' && (
            <>
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
              <Field label="Lien 'Tout voir' (facultatif)">
                <input className={INPUT_CLS} value={c.viewAllHref || ''} onChange={(e) => updateContent({ viewAllHref: e.target.value })} placeholder="/collections" />
              </Field>
              <Field label="Filtre produits">
                <Segmented
                  value={c.filter || 'all'}
                  onChange={(v) => updateContent({ filter: v })}
                  options={[
                    { v: 'classiques', label: 'Classiques' },
                    { v: 'intemporels', label: 'Intemporels' },
                    { v: 'pe-2026-2027', label: 'PE 26-27' },
                    { v: 'all', label: 'Tous' },
                  ]}
                />
              </Field>
              <Field label="Nombre de produits">
                <input type="number" min={2} max={20} className={INPUT_CLS} value={c.limit || 8} onChange={(e) => updateContent({ limit: Number(e.target.value) })} />
              </Field>
              <label className="flex items-center gap-2 py-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={c.hideBadges === true}
                  onChange={(e) => updateContent({ hideBadges: e.target.checked })}
                  className="h-4 w-4 accent-emerald"
                />
                <span className="text-sm text-ink/70">Masquer les badges Nouveau / Édition sur les photos</span>
              </label>
              <PickedProductsManager
                picked={Array.isArray(c.pickedProducts) ? c.pickedProducts : []}
                onChange={(next) => updateContent({ pickedProducts: next })}
              />
            </>
          )}

          {(section.type === 'category-tiles' || section.type === 'collections-themes') && (
            <div className="bg-cream/40 border border-linen p-4 text-sm text-ink/70 leading-relaxed">
              Les collections (Racine, Empreinte) se modifient depuis l'écran <strong>Éditeur de l'accueil → Collections</strong> dans l'admin complet.
            </div>
          )}

          {(section.type === 'lifestyle' || section.type === 'iconic-plaid') && (
            <>
              <Field label="Petit texte (sur-titre)">
                <input className={INPUT_CLS} value={c.eyebrow || ''} onChange={(e) => updateContent({ eyebrow: e.target.value })} />
              </Field>
              <Field label="Grand titre">
                <input className={INPUT_CLS} value={c.title || ''} onChange={(e) => updateContent({ title: e.target.value })} />
              </Field>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-auto px-5 py-4 border-t border-linen bg-ivory">
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

/* ------------------------------- Helpers UI ------------------------------- */

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={LABEL_CLS}>{label}</span>
      {children}
    </label>
  )
}

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex gap-1 p-1 bg-cream rounded-sm">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={`flex-1 h-10 text-[11px] uppercase tracking-[0.2em] rounded-sm transition ${
            value === o.v ? 'bg-ink text-ivory' : 'text-ink/60 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function ToggleRow({ label, value, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer select-none">
      <span className="text-sm text-ink/80">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${
          value ? 'bg-emerald' : 'bg-ink/20'
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 bg-ivory rounded-full shadow transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  )
}


function ImageField({ value, onChange }) {
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
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 h-9 w-9 flex items-center justify-center bg-ink/80 text-ivory hover:bg-terracotta rounded-sm"
            aria-label="Retirer l'image"
          >
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

/* Minimal custom image manager embedded in the panel */
function CustomImagesManager({ images, onChange }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return 'img-' + Math.random().toString(36).slice(2, 8)
  }
  async function upload(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(true)
    setErr('')
    try {
      const next = [...images]
      for (const file of files) {
        const fd = new FormData()
        fd.append('file', file)
        const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json()
        if (!r.ok || !d.url) throw new Error(d.error || 'Échec upload')
        next.push({ id: uid(), src: d.url, alt: file.name.replace(/\.[^.]+$/, '') })
      }
      onChange(next)
    } catch (e) {
      setErr(e.message || 'Erreur')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="pt-5 border-t border-linen">
      <div className="flex items-center justify-between mb-3">
        <span className={LABEL_CLS + ' mb-0'}>Images personnalisées ({images.length})</span>
        {images.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald">Mode galerie</span>
        )}
      </div>
      <p className="text-xs text-ink/55 leading-relaxed mb-3">
        Si vous ajoutez des images, le carrousel les affichera au lieu des produits. Pour revenir au mode produits : retirez toutes les images.
      </p>
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {images.map((img) => (
            <div key={img.id || img.src} className="relative aspect-square bg-cream border border-linen overflow-hidden rounded-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt || ''} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((i) => (i.id || i.src) !== (img.id || img.src)))}
                className="absolute top-1 right-1 h-7 w-7 flex items-center justify-center bg-ink/80 text-ivory hover:bg-terracotta rounded-sm"
                aria-label="Retirer"
              >
                <Trash2 className="h-3 w-3" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="block cursor-pointer">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} disabled={busy} />
        <span className={`block w-full h-11 flex items-center justify-center text-[11px] uppercase tracking-[0.22em] border border-ink/20 hover:border-emerald transition rounded-sm ${busy ? 'opacity-50' : ''}`}>
          {busy ? 'Import en cours…' : 'Ajouter des photos'}
        </span>
      </label>
      {err && <p className="text-xs text-terracotta mt-2">{err}</p>}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/*  PickedProductsManager — remplace "ajouter des photos" par de vrais     */
/*  produits (prix + couleurs + lien fiche produit). Vitrine de vente.    */
/* ---------------------------------------------------------------------- */

function PickedProductsManager({ picked, onChange }) {
  const [openModal, setOpenModal] = useState(false)
  const [pickedDetails, setPickedDetails] = useState([])
  const [loading, setLoading] = useState(false)

  // Charge les détails des produits sélectionnés
  useEffect(() => {
    if (!picked.length) {
      setPickedDetails([])
      return
    }
    setLoading(true)
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        const all = d.products || []
        const map = new Map(all.map((p) => [p.slug, p]))
        setPickedDetails(picked.map((slug) => map.get(slug)).filter(Boolean))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [picked])

  const removeAt = (i) => onChange(picked.filter((_, j) => j !== i))
  const moveUp = (i) => {
    if (i === 0) return
    const next = picked.slice()
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }
  const moveDown = (i) => {
    if (i === picked.length - 1) return
    const next = picked.slice()
    ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
    onChange(next)
  }

  return (
    <div className="pt-5 border-t border-linen">
      <div className="flex items-center justify-between mb-3">
        <span className={LABEL_CLS + ' mb-0'}>
          Produits sélectionnés ({picked.length})
        </span>
        {picked.length > 0 && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-emerald">
            Vitrine manuelle
          </span>
        )}
      </div>
      <p className="text-xs text-ink/55 leading-relaxed mb-3">
        Choisissez vous-même les produits à afficher dans le carrousel. Chaque
        produit garde son prix, ses couleurs et renvoie vers sa fiche quand on
        clique dessus. Laissez vide pour utiliser le filtre automatique.
      </p>

      {loading && <div className="text-xs text-ink/50 mb-2">Chargement…</div>}

      {pickedDetails.length > 0 && (
        <ul className="space-y-2 mb-3">
          {pickedDetails.map((p, i) => (
            <li
              key={p.slug}
              className="flex items-center gap-3 border border-linen bg-ivory p-2 rounded-sm"
            >
              <div className="h-14 w-14 flex-none bg-cream overflow-hidden rounded-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-ink/60 tabular-nums">
                  {Number(p.price).toFixed(2).replace('.', ',')} €
                  {p.variants?.length ? ` · ${p.variants.length} coul.` : ''}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="h-6 w-6 flex items-center justify-center border border-ink/10 hover:border-ink text-[10px] rounded-sm disabled:opacity-30"
                  aria-label="Monter"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(i)}
                  disabled={i === pickedDetails.length - 1}
                  className="h-6 w-6 flex items-center justify-center border border-ink/10 hover:border-ink text-[10px] rounded-sm disabled:opacity-30"
                  aria-label="Descendre"
                >
                  ↓
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="h-9 w-9 flex items-center justify-center bg-ink/5 hover:bg-brique hover:text-ivory rounded-sm"
                aria-label="Retirer"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpenModal(true)}
        className="w-full h-11 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.22em] bg-ink text-ivory hover:bg-emerald transition rounded-sm"
      >
        <Plus className="h-4 w-4" strokeWidth={1.8} />
        Ajouter des produits
      </button>

      {openModal && (
        <ProductPickerModal
          picked={picked}
          onClose={() => setOpenModal(false)}
          onConfirm={(next) => { onChange(next); setOpenModal(false) }}
        />
      )}
    </div>
  )
}

/* ---------------------------------------------------------------------- */
/*  Modal de sélection de produits — recherche + liste scrollable         */
/* ---------------------------------------------------------------------- */

function ProductPickerModal({ picked, onClose, onConfirm }) {
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState('all')
  const [selected, setSelected] = useState(new Set(picked))

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAll(d.products || []))
      .finally(() => setLoading(false))
  }, [])

  const categories = Array.from(new Set(all.map((p) => p.category))).filter(Boolean)

  const q = query.toLowerCase().trim()
  const filtered = all.filter((p) => {
    if (cat !== 'all' && p.category !== cat) return false
    if (!q) return true
    return ((p.name || '') + ' ' + (p.material || '') + ' ' + (p.color || ''))
      .toLowerCase()
      .includes(q)
  })

  const toggle = (slug) => {
    const next = new Set(selected)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    setSelected(next)
  }

  const confirm = () => {
    // Garde l'ordre existant pour les anciens sélectionnés, ajoute les nouveaux à la fin
    const existing = picked.filter((s) => selected.has(s))
    const additions = Array.from(selected).filter((s) => !picked.includes(s))
    onConfirm([...existing, ...additions])
  }

  return createPortal(
    <div className="fixed inset-0 z-[260] flex items-stretch md:items-center justify-center bg-ink/60 p-0 md:p-6">
      <div
        className="bg-ivory w-full md:max-w-2xl md:h-[80vh] md:rounded-sm flex flex-col shadow-2xl"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: '100dvh',
          maxHeight: '100dvh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-linen">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-emerald mb-1">Vitrine</div>
            <div className="font-display text-xl">
              Choisissez les produits
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-11 w-11 flex items-center justify-center border border-ink/15 hover:border-ink rounded-sm"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>

        {/* Search + filters */}
        <div className="px-5 py-3 border-b border-linen space-y-3">
          <div className="flex items-center gap-2 border border-ink/15 bg-ivory px-3">
            <Search className="h-4 w-4 text-ink/40" strokeWidth={1.5} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              className="flex-1 bg-transparent text-sm outline-none py-2.5"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
              <PickChip label="Tous" active={cat === 'all'} onClick={() => setCat('all')} />
              {categories.map((c) => (
                <PickChip key={c} label={c} active={cat === c} onClick={() => setCat(c)} />
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
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
                      className={`w-full text-left flex items-center gap-3 p-2 border transition rounded-sm ${
                        isSelected
                          ? 'border-emerald bg-emerald/5'
                          : 'border-linen hover:border-ink/30'
                      }`}
                    >
                      <div className="h-16 w-16 flex-none bg-cream overflow-hidden rounded-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images?.[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div className="text-xs text-ink/60 tabular-nums">
                          {Number(p.price).toFixed(2).replace('.', ',')} €
                        </div>
                        {p.variants?.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {p.variants.slice(0, 5).map((v, i) => (
                              <span
                                key={i}
                                className="h-3 w-3 rounded-full border border-ink/15"
                                style={{ background: v.hex || '#eee' }}
                                title={v.name}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <span
                        className={`h-6 w-6 flex-none rounded-full border-2 flex items-center justify-center transition ${
                          isSelected ? 'bg-emerald border-emerald text-ivory' : 'border-ink/20'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-linen flex items-center gap-3 bg-ivory">
          <div className="flex-1 text-sm">
            <strong className="tabular-nums">{selected.size}</strong>{' '}
            <span className="text-ink/60">produit{selected.size > 1 ? 's' : ''} sélectionné{selected.size > 1 ? 's' : ''}</span>
          </div>
          <button
            onClick={onClose}
            className="h-11 px-4 text-[11px] uppercase tracking-[0.22em] border border-ink/20 hover:border-ink rounded-sm"
          >
            Annuler
          </button>
          <button
            onClick={confirm}
            className="h-11 px-5 bg-ink text-ivory text-[11px] uppercase tracking-[0.22em] hover:bg-emerald rounded-sm flex items-center gap-2"
          >
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
      className={`flex-none px-3 h-9 text-[10px] uppercase tracking-[0.22em] border rounded-sm transition ${
        active ? 'bg-ink text-ivory border-ink' : 'border-ink/15 text-ink/70 hover:border-ink'
      }`}
    >
      {label}
    </button>
  )
}
