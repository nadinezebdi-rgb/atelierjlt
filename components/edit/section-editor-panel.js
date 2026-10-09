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
import { X, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react'

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
              <CustomImagesManager
                images={Array.isArray(c.customImages) ? c.customImages : []}
                onChange={(next) => updateContent({ customImages: next })}
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
