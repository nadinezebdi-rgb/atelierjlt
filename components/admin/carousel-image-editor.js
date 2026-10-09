'use client'

/**
 * Atelier JLT — Éditeur d'images pour les sections de type "product-carousel".
 *
 * Permet à l'admin d'importer des images personnalisées qui prendront le pas
 * sur l'affichage des cartes produits. Si aucune image n'est importée, le
 * carrousel conserve son mode "produits" habituel.
 *
 * - Upload via l'endpoint existant /api/admin/upload (authentifié).
 * - Picker : réutilise la médiathèque CMS (/api/admin/media).
 * - Formats acceptés : JPG, PNG, WEBP. HEIC/HEIF à convertir en amont.
 * - Le serveur contrôle l'authentification et la taille réelle.
 *
 * Props :
 *   images     : [{ id, src, alt, href? }, ...]
 *   onChange   : (nextImages) => void   // doit mettre à jour le brouillon de la section
 *   disabled?  : boolean
 *   maxFileBytes? : number (default 10 MB)
 */
import { useId, useRef, useState } from 'react'

const styles = `
.jlt-images{font-family:inherit;color:#292b25}
.jlt-images *{box-sizing:border-box}
.jlt-images__toolbar,.jlt-images__actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.jlt-images button{font:inherit;min-height:44px;padding:8px 14px;border:1px solid #d9d2c5;border-radius:6px;background:#faf8f3;color:#155c46;cursor:pointer}
.jlt-images button:disabled{opacity:.45;cursor:default}
.jlt-images :focus-visible{outline:3px solid #155c46;outline-offset:3px}
.jlt-images__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;padding:0;list-style:none}
.jlt-images__card{padding:12px;border:1px solid #ded8cd;background:#faf8f3;border-radius:8px;min-width:0}
.jlt-images__card img{display:block;width:100%;height:180px;object-fit:cover;border-radius:4px;background:#eee9df}
.jlt-images__card label{display:block;margin:12px 0}
.jlt-images__card input{display:block;width:100%;padding:10px;margin-top:5px;border:1px solid #d9d2c5;border-radius:4px;font:inherit;background:white;color:#292b25}
.jlt-images__help{font-size:.9em;color:#625e55}
.jlt-images__error{color:#9c2929;white-space:pre-line}
`

// Refuse les URL temporaires (blob/data), protocoles actifs, //host.
// Autorise /chemin-relatif ou URL https.
function safeUrl(value) {
  if (!value || typeof value !== 'string' || value.trim() !== value) return false
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0020]/.test(value)) return false
  if (value.startsWith('/') && !value.startsWith('//')) return true
  try {
    const u = new URL(value)
    return u.protocol === 'https:' || u.protocol === 'http:'
  } catch {
    return false
  }
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'img-' + Math.random().toString(36).slice(2, 10)
}

function normalizeImage(image) {
  if (!image || !safeUrl(image.src)) {
    throw new Error("URL d'image invalide ou non durable.")
  }
  if (image.href && !safeUrl(image.href)) {
    throw new Error("Le lien associé à l'image est invalide.")
  }
  return {
    id: image.id || makeId(),
    src: image.src,
    alt: image.alt ?? '',
    href: image.href || undefined,
  }
}

// Upload réutilisant l'endpoint existant du CMS (auth cookie session admin).
async function defaultUpload(file) {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch('/api/admin/upload', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok || !d.url) {
    throw new Error(d.error || 'Échec de l\'import.')
  }
  return { src: d.url, alt: file.name.replace(/\.[^.]+$/, '') }
}

// Picker réutilisant la médiathèque existante (site_content.mediaLibrary).
async function defaultPickFromLibrary() {
  const r = await fetch('/api/site-content', { credentials: 'include' })
  const d = await r.json().catch(() => ({}))
  const files = Array.isArray(d?.content?.mediaLibrary)
    ? d.content.mediaLibrary
    : []
  if (!files.length) {
    throw new Error(
      "La médiathèque est vide — importez d'abord une image dans l'admin."
    )
  }
  // Petit prompt natif pour sélection rapide — intégration minimale.
  const choices = files
    .map(
      (f, i) =>
        `${i + 1}. ${f.name || f.alt || (f.url || f.src || '').split('/').slice(-1)[0] || '(sans nom)'}`
    )
    .join('\n')
  const raw = window.prompt(
    `Choisissez le numéro d'une image de la médiathèque :\n\n${choices}`,
    ''
  )
  const idx = parseInt(raw, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= files.length) return []
  const sel = files[idx]
  return [{ src: sel.url || sel.src, alt: sel.name || sel.alt || '' }]
}

export default function CarouselImageEditor({
  images = [],
  onChange,
  onUpload = defaultUpload,
  onPickFromLibrary = defaultPickFromLibrary,
  disabled = false,
  maxFileBytes = 10 * 1024 * 1024,
}) {
  const inputId = useId()
  const addInput = useRef(null)
  const replaceInput = useRef(null)
  const replaceId = useRef(null)
  const latestImages = useRef(images)
  latestImages.current = images
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const locked = disabled || busy

  function begin() {
    if (disabled || inFlight.current) return false
    inFlight.current = true
    setBusy(true)
    setError('')
    setMessage('Import en cours…')
    return true
  }
  function finish() {
    inFlight.current = false
    setBusy(false)
  }
  function commit(next) {
    onChange(next)
    latestImages.current = next
  }
  function insert(added, targetId) {
    const current = latestImages.current
    if (targetId) {
      if (!current.some((image) => image.id === targetId)) {
        throw new Error("L'image à remplacer a changé. Réessayez.")
      }
      commit(
        current.map((image) =>
          image.id === targetId
            ? { ...image, src: added[0].src, alt: image.alt || added[0].alt }
            : image
        )
      )
    } else {
      commit([...current, ...added])
    }
  }

  async function upload(event, targetId) {
    const files = Array.from(event.currentTarget.files || [])
    event.currentTarget.value = '' // permet de resélectionner le même fichier
    if (!files.length || !begin()) return
    const added = []
    const failures = []
    try {
      const batch = targetId ? files.slice(0, 1) : files
      for (const file of batch) {
        try {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            throw new Error('Utilisez JPG, PNG ou WEBP.')
          }
          if (file.size === 0) throw new Error('Le fichier est vide.')
          if (file.size > maxFileBytes) {
            throw new Error(
              `Maximum ${Math.round(maxFileBytes / 1024 / 1024)} Mo par image.`
            )
          }
          const result = await onUpload(file)
          added.push(
            normalizeImage({
              ...result,
              alt: result.alt || file.name.replace(/\.[^.]+$/, ''),
            })
          )
        } catch (cause) {
          failures.push(
            `${file.name} : ${
              cause instanceof Error ? cause.message : 'Échec de l\'import.'
            }`
          )
        }
      }
      if (added.length) insert(added, targetId)
      setMessage(
        added.length
          ? `${added.length} image(s) ${
              targetId ? 'remplacée(s)' : 'ajoutée(s)'
            }. Cliquez sur Enregistrer pour publier.`
          : 'Aucune image ajoutée.'
      )
      setError(failures.join('\n'))
    } catch (cause) {
      setMessage('')
      setError(
        cause instanceof Error ? cause.message : 'Impossible de mettre à jour.'
      )
    } finally {
      finish()
    }
  }

  async function pickFromLibrary() {
    if (!onPickFromLibrary || !begin()) return
    try {
      const selected = await onPickFromLibrary()
      if (selected && selected.length) {
        insert(selected.map(normalizeImage), null)
      }
      setMessage(
        selected && selected.length
          ? 'Images ajoutées. Cliquez sur Enregistrer pour publier.'
          : 'Sélection annulée.'
      )
    } catch (cause) {
      setMessage('')
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'ouvrir la médiathèque."
      )
    } finally {
      finish()
    }
  }

  function move(id, direction) {
    const current = latestImages.current
    const index = current.findIndex((image) => image.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= current.length) return
    const next = [...current]
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
    setMessage('Ordre modifié. Cliquez sur Enregistrer.')
  }

  return (
    <section
      className="jlt-images"
      aria-label="Images personnalisées du carrousel"
      aria-busy={busy}
    >
      <style>{styles}</style>
      <h4 className="text-[11px] uppercase tracking-[0.32em] text-emerald mt-0 mb-2">
        Images personnalisées
      </h4>
      <p className="jlt-images__help">
        Importez vos photos ou choisissez des images existantes. Dès qu'une image est
        ajoutée, le carrousel affiche vos photos au lieu des produits automatiques.
        Pour revenir au mode produits, retirez toutes les images.
      </p>
      <div className="jlt-images__toolbar">
        <button
          type="button"
          disabled={locked}
          onClick={() => addInput.current?.click()}
        >
          Importer des images
        </button>
        {onPickFromLibrary && (
          <button
            type="button"
            disabled={locked}
            onClick={pickFromLibrary}
          >
            Choisir dans la médiathèque
          </button>
        )}
      </div>
      <input
        ref={addInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        disabled={locked}
        onChange={(event) => {
          void upload(event, null)
        }}
      />
      <input
        ref={replaceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        disabled={locked}
        onChange={(event) => {
          void upload(event, replaceId.current)
        }}
      />
      <p className="jlt-images__help">
        JPG · PNG · WEBP · {Math.round(maxFileBytes / 1024 / 1024)} Mo maximum par image
      </p>
      <p role="status" aria-live="polite">
        {message}
      </p>
      {error && (
        <p role="alert" className="jlt-images__error">
          {error}
        </p>
      )}
      {images.length > 0 && (
        <ul className="jlt-images__grid">
          {images.map((image, index) => (
            <li key={image.id} className="jlt-images__card">
              {safeUrl(image.src) && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={image.src} alt={image.alt} loading="lazy" />
              )}
              <label htmlFor={`${inputId}-${image.id}`}>
                Description de l'image {index + 1}
                <input
                  id={`${inputId}-${image.id}`}
                  value={image.alt}
                  disabled={locked}
                  onChange={(event) =>
                    commit(
                      latestImages.current.map((item) =>
                        item.id === image.id
                          ? { ...item, alt: event.target.value }
                          : item
                      )
                    )
                  }
                />
              </label>
              <div className="jlt-images__actions">
                <button
                  type="button"
                  disabled={locked}
                  aria-label={`Remplacer l'image ${index + 1}`}
                  onClick={() => {
                    replaceId.current = image.id
                    replaceInput.current?.click()
                  }}
                >
                  Remplacer
                </button>
                <button
                  type="button"
                  disabled={locked || index === 0}
                  aria-label={`Avancer l'image ${index + 1}`}
                  onClick={() => move(image.id, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  disabled={locked || index === images.length - 1}
                  aria-label={`Reculer l'image ${index + 1}`}
                  onClick={() => move(image.id, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  disabled={locked}
                  aria-label={`Retirer l'image ${index + 1} du carrousel`}
                  onClick={() => {
                    commit(
                      latestImages.current.filter(
                        (item) => item.id !== image.id
                      )
                    )
                    setMessage(
                      'Image retirée du bloc. Cliquez sur Enregistrer.'
                    )
                  }}
                >
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Petit utilitaire exporté pour la page publique (filtre les URLs valides). */
export function filterSafeImages(images) {
  if (!Array.isArray(images)) return []
  return images.filter((i) => i && safeUrl(i.src))
}
