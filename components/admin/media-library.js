'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Upload, Trash2, Copy, Check, Eye, X, FolderOpen, Film, FileText, Search, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function MediaLibrary({ files, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState(null)
  const [editingTagsUrl, setEditingTagsUrl] = useState(null)
  const [showOrphans, setShowOrphans] = useState(false)
  const dropRef = useState({ dragging: false })[0]

  const handleFiles = async (fileList) => {
    if (!fileList || !fileList.length) return
    setUploading(true)
    const uploaded = []
    for (const file of fileList) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json()
        if (r.ok && d.url) {
          const entry = {
            url: d.url,
            filename: d.filename,
            kind: d.kind,
            size: d.size,
            originalName: d.originalName || file.name,
            uploadedAt: new Date().toISOString(),
            compressed: d.compressed || false,
            originalSize: d.originalSize || d.size,
          }
          // Génère la miniature PDF côté client
          if (d.kind === 'pdf') {
            try {
              const { generatePdfThumbnail } = await import('@/lib/pdf-thumbnail')
              const thumb = await generatePdfThumbnail(file, 400)
              if (thumb) entry.thumbnail = thumb
            } catch (e) {
              console.warn('PDF thumb skip', e)
            }
          }
          uploaded.push(entry)
          if (d.compressed) {
            const saved = ((d.originalSize - d.size) / 1024 / 1024).toFixed(1)
            toast.success(`${file.name} compressé (−${saved} Mo)`)
          }
        } else {
          toast.error(d.error || 'Envoi échoué')
        }
      } catch (e) {
        toast.error('Envoi échoué')
      }
    }
    setUploading(false)
    if (uploaded.length) {
      onChange([...uploaded, ...(files || [])])
      toast.success(`${uploaded.length} fichier(s) téléchargé(s)`)
    }
  }

  const remove = (url) => {
    if (!confirm('Retirer ce fichier de la bibliothèque ? Le fichier reste sur le serveur.')) return
    onChange(files.filter((f) => f.url !== url))
  }

  const copy = async (url) => {
    try {
      const full = window.location.origin + url
      await navigator.clipboard.writeText(full)
      setCopiedUrl(url)
      toast.success('Lien copié')
      setTimeout(() => setCopiedUrl(null), 2000)
    } catch {
      toast.error('Impossible de copier')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
  }

  const onDrop = async (e) => {
    e.preventDefault()
    dropRef.dragging = false
    e.currentTarget.classList.remove('ring-2', 'ring-emerald')
    const dropped = Array.from(e.dataTransfer.files || [])
    if (dropped.length) await handleFiles(dropped)
  }

  // Filter + sort
  const filtered = (files || [])
    .filter((f) => typeFilter === 'all' || f.kind === typeFilter)
    .filter((f) => !tagFilter || (f.tags || []).includes(tagFilter))
    .filter((f) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (f.originalName || f.filename || '').toLowerCase().includes(q)
    })
    .slice()
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':  return new Date(a.uploadedAt || 0) - new Date(b.uploadedAt || 0)
        case 'size-desc': return (b.size || 0) - (a.size || 0)
        case 'size-asc':  return (a.size || 0) - (b.size || 0)
        case 'name-asc':  return (a.originalName || '').localeCompare(b.originalName || '', 'fr')
        case 'name-desc': return (b.originalName || '').localeCompare(a.originalName || '', 'fr')
        case 'date-desc':
        default:          return new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0)
      }
    })

  const totalCount = (files || []).length
  const typeCounts = (files || []).reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] || 0) + 1
    return acc
  }, {})

  // Tous les tags uniques + comptage
  const allTags = Array.from(new Set(
    (files || []).flatMap((f) => f.tags || [])
  )).sort()

  const updateTags = (url, tags) => {
    const clean = tags.map((t) => t.trim()).filter(Boolean)
    onChange((files || []).map((f) => f.url === url ? { ...f, tags: clean } : f))
  }

  return (
    <section className="border border-linen bg-ivory p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> Bibliothèque de fichiers
            {totalCount > 0 && (
              <span className="text-ink/40 normal-case tracking-normal">
                · {totalCount} fichier{totalCount > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <p className="text-xs text-ink/60 mt-2 max-w-2xl">
            Téléchargez photos, vidéos et documents pour les réutiliser partout.
            Les images de plus de 2 Mo sont compressées automatiquement.
          </p>
        </div>
        <label
          className={cn(
            'inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] px-5 py-3 bg-emerald text-ivory hover:bg-emeraldDark transition cursor-pointer',
            uploading && 'opacity-60 cursor-wait'
          )}
        >
          <Upload className="h-4 w-4" strokeWidth={1.5} />
          {uploading ? 'Envoi en cours…' : 'Télécharger un fichier'}
          <input
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('ring-2', 'ring-emerald')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('ring-2', 'ring-emerald')
        }}
        onDrop={onDrop}
        className="border-2 border-dashed border-ink/15 bg-cream/30 rounded-sm p-8 text-center transition mb-6"
      >
        <Upload className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-ink/60">
          Glissez-déposez vos fichiers ici, ou cliquez sur <strong>Télécharger un fichier</strong> ci-dessus
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-ink/40">
          PNG · JPG · WEBP · MP4 · WEBM · PDF · max 50 Mo · compression auto {'>'}2 Mo
        </p>
      </div>

      {/* Barre de recherche + filtres + tri */}
      {totalCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" strokeWidth={1.5} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom…"
              className="w-full bg-transparent border border-ink/15 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { key: 'all',   label: `Tous · ${totalCount}` },
              { key: 'image', label: `Images · ${typeCounts.image || 0}`, disabled: !typeCounts.image },
              { key: 'video', label: `Vidéos · ${typeCounts.video || 0}`, disabled: !typeCounts.video },
              { key: 'pdf',   label: `PDF · ${typeCounts.pdf || 0}`, disabled: !typeCounts.pdf },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTypeFilter(t.key)}
                disabled={t.disabled}
                className={cn(
                  'text-[10px] uppercase tracking-[0.22em] px-3 py-2 border transition',
                  typeFilter === t.key ? 'bg-ink text-ivory border-ink' : 'border-ink/20 hover:border-ink text-ink/70',
                  t.disabled && 'opacity-40 cursor-not-allowed'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-ink/60">
            <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-ink/15 px-2 py-1.5 text-[11px] uppercase tracking-[0.22em] focus:outline-none focus:border-emerald cursor-pointer"
            >
              <option value="date-desc">Récents d'abord</option>
              <option value="date-asc">Anciens d'abord</option>
              <option value="size-desc">Plus lourds</option>
              <option value="size-asc">Plus légers</option>
              <option value="name-asc">Nom A→Z</option>
              <option value="name-desc">Nom Z→A</option>
            </select>
          </div>
        </div>
      )}

      {/* Rangée des tags */}
      {totalCount > 0 && allTags.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.24em] text-ink/50">Tags :</span>
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={cn(
              'text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 border transition',
              !tagFilter ? 'bg-emerald text-ivory border-emerald' : 'border-ink/20 hover:border-emerald text-ink/70'
            )}
          >
            Tous
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              className={cn(
                'text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 border transition',
                tagFilter === tag ? 'bg-emerald text-ivory border-emerald' : 'border-ink/20 hover:border-emerald text-ink/70'
              )}
            >
              # {tag}
            </button>
          ))}
        </div>
      )}

      {/* Bouton nettoyage — analyse des orphelins */}
      {totalCount > 0 && (
        <div className="mb-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowOrphans(true)}
            className="text-[10px] uppercase tracking-[0.22em] px-3 py-2 border border-ink/20 hover:border-terracotta hover:text-terracotta transition"
          >
            🧹 Analyser les fichiers orphelins
          </button>
        </div>
      )}

      {/* Grille de fichiers */}
      {totalCount === 0 ? (
        <p className="text-sm text-ink/50 italic text-center py-6">
          Aucun fichier téléchargé pour l’instant.
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink/50 italic text-center py-6">
          Aucun fichier ne correspond à votre recherche.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((f) => (
            <div key={f.url} className="border border-linen bg-ivory group overflow-hidden">
              <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                {f.kind === 'image' ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" className="w-full h-full object-cover" />
                ) : f.kind === 'video' ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                    <Film className="h-10 w-10" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.22em] mt-2">Vidéo</span>
                  </div>
                ) : f.thumbnail ? (
                  // Aperçu PDF (première page)
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.thumbnail} alt="" className="w-full h-full object-contain bg-ivory" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                    <FileText className="h-10 w-10" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-[0.22em] mt-2">PDF</span>
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-ink/70 text-ivory text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 backdrop-blur">
                  {f.kind}
                </span>
                {f.compressed && (
                  <span
                    className="absolute top-2 right-2 bg-emerald text-ivory text-[9px] uppercase tracking-[0.22em] px-2 py-0.5 backdrop-blur"
                    title={`Compressé de ${formatSize(f.originalSize)} à ${formatSize(f.size)}`}
                  >
                    ↓ Optimisé
                  </span>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="text-xs text-ink/80 truncate" title={f.originalName}>
                  {f.originalName || f.filename}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] text-ink/40 tabular-nums">{formatSize(f.size)}</div>
                  <button
                    type="button"
                    onClick={() => setEditingTagsUrl(f.url)}
                    className="text-[9px] uppercase tracking-[0.22em] text-ink/50 hover:text-emerald transition"
                  >
                    # tags
                  </button>
                </div>
                {(f.tags || []).length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {(f.tags || []).slice(0, 3).map((t) => (
                      <span key={t} className="text-[9px] uppercase tracking-[0.2em] bg-emerald/10 text-emerald px-1.5 py-0.5">
                        {t}
                      </span>
                    ))}
                    {(f.tags || []).length > 3 && (
                      <span className="text-[9px] text-ink/40">+{(f.tags || []).length - 3}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => copy(f.url)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.2em] px-2 py-1.5 border border-ink/20 hover:border-emerald hover:text-emerald transition"
                  >
                    {copiedUrl === f.url ? (
                      <><Check className="h-3 w-3 text-emerald" strokeWidth={1.5} /> Copié</>
                    ) : (
                      <><Copy className="h-3 w-3" strokeWidth={1.5} /> Lien</>
                    )}
                  </button>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-2 py-1.5 border border-ink/20 hover:border-emerald hover:text-emerald transition"
                    aria-label="Ouvrir"
                  >
                    <Eye className="h-3 w-3" strokeWidth={1.5} />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(f.url)}
                    className="inline-flex items-center justify-center px-2 py-1.5 text-terracotta hover:opacity-70"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-ink/45">
        💡 Astuce : cliquez sur <strong>Lien</strong> pour copier l’URL et la coller dans un article ou une bannière.
      </p>

      {/* Modale édition tags */}
      <AnimatePresence>
        {editingTagsUrl && (
          <TagEditorModal
            file={(files || []).find((f) => f.url === editingTagsUrl)}
            existingTags={allTags}
            onSave={(tags) => { updateTags(editingTagsUrl, tags); setEditingTagsUrl(null) }}
            onClose={() => setEditingTagsUrl(null)}
          />
        )}
      </AnimatePresence>

      {/* Modale nettoyage orphelins */}
      <AnimatePresence>
        {showOrphans && (
          <OrphanCleanupModal onClose={() => setShowOrphans(false)} />
        )}
      </AnimatePresence>
    </section>
  )
}

/* Modale — édition des tags d'un fichier */
function TagEditorModal({ file, existingTags, onSave, onClose }) {
  const [tags, setTags] = useState(file?.tags || [])
  const [input, setInput] = useState('')

  if (!file) return null

  const add = (t) => {
    const clean = t.trim().toLowerCase().replace(/[^a-z0-9àâäéèêëïîôöùûüÿç\- ]/g, '')
    if (!clean) return
    if (tags.includes(clean)) return
    setTags([...tags, clean])
    setInput('')
  }
  const remove = (t) => setTags(tags.filter((x) => x !== t))
  const suggestions = existingTags.filter((t) => !tags.includes(t)).slice(0, 12)

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed inset-x-4 top-[15vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[15vh] md:w-[min(560px,92vw)] bg-ivory z-50 shadow-2xl"
      >
        <div className="border-b border-linen p-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.32em] text-emerald">Tags</span>
            <h3 className="font-display text-2xl mt-1 truncate">{file.originalName || file.filename}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="hover:opacity-60 flex-shrink-0">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => remove(t)}
                  className="text-[10px] uppercase tracking-[0.22em] bg-emerald text-ivory px-3 py-1.5 flex items-center gap-2 hover:bg-terracotta transition"
                >
                  # {t} <X className="h-3 w-3" strokeWidth={2} />
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); add(input) }
                if (e.key === ',') { e.preventDefault(); add(input) }
              }}
              placeholder="Ajouter un tag (ex: hero, produit, promo)…"
              className="flex-1 bg-transparent border border-ink/15 px-3 py-2 text-sm focus:outline-none focus:border-emerald"
            />
            <button
              type="button"
              onClick={() => add(input)}
              className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 border border-ink/20 hover:border-emerald hover:text-emerald transition"
            >
              Ajouter
            </button>
          </div>
          {suggestions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => add(t)}
                    className="text-[10px] uppercase tracking-[0.22em] border border-ink/15 px-2.5 py-1 hover:border-emerald hover:text-emerald transition"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="border-t border-linen p-4 flex items-center justify-end gap-3">
          <button type="button" onClick={onClose} className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 border border-ink/25 hover:bg-linen/50 transition">
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onSave(tags)}
            className="text-[11px] uppercase tracking-[0.24em] px-6 py-2.5 bg-emerald text-ivory hover:bg-emeraldDark transition"
          >
            Enregistrer
          </button>
        </div>
      </motion.div>
    </>
  )
}

/* Modale — analyse et nettoyage des fichiers orphelins */
function OrphanCleanupModal({ onClose }) {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/admin/files', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setScan(d))
      .catch(() => setScan({ orphans: [], error: true }))
      .finally(() => setLoading(false))
  }, [])

  const deleteOne = async (filename) => {
    if (!confirm(`Supprimer définitivement ${filename} ?`)) return
    setDeleting(true)
    try {
      const r = await fetch('/api/admin/files?filename=' + encodeURIComponent(filename), {
        method: 'DELETE', credentials: 'include',
      })
      if (r.ok) {
        toast.success('Fichier supprimé')
        setScan((prev) => ({
          ...prev,
          orphans: prev.orphans.filter((o) => o.filename !== filename),
        }))
      } else toast.error('Suppression échouée')
    } finally { setDeleting(false) }
  }

  const deleteAll = async () => {
    if (!scan?.orphans?.length) return
    if (!confirm(`Supprimer définitivement les ${scan.orphans.length} fichiers orphelins ? Cette action est irréversible.`)) return
    setDeleting(true)
    let success = 0
    for (const o of scan.orphans) {
      try {
        const r = await fetch('/api/admin/files?filename=' + encodeURIComponent(o.filename), {
          method: 'DELETE', credentials: 'include',
        })
        if (r.ok) success++
      } catch {}
    }
    toast.success(`${success} fichier(s) supprimé(s)`)
    setScan((prev) => ({ ...prev, orphans: [] }))
    setDeleting(false)
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-ink/50 z-50" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        className="fixed inset-x-4 top-[8vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[8vh] md:w-[min(800px,94vw)] max-h-[84vh] overflow-hidden flex flex-col bg-ivory z-50 shadow-2xl"
      >
        <div className="border-b border-linen p-6 flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <span className="text-[10px] uppercase tracking-[0.32em] text-terracotta">Nettoyage</span>
            <h3 className="font-display text-2xl mt-1">Fichiers orphelins</h3>
            <p className="text-xs text-ink/60 mt-1">
              Ces fichiers sont sur le serveur mais ne sont plus référencés nulle part (retirés d'une bannière, article, produit…).
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="hover:opacity-60 flex-shrink-0">
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
        <div className="p-6 flex-1 overflow-auto">
          {loading ? (
            <p className="text-sm text-ink/50 italic text-center py-12">Analyse en cours…</p>
          ) : !scan?.orphans || scan.orphans.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">✨</div>
              <p className="text-ink/70">Aucun fichier orphelin détecté.</p>
              <p className="text-[11px] text-ink/40 mt-2">
                Tous les fichiers téléchargés sont utilisés quelque part.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between bg-terracotta/10 border border-terracotta/20 p-4">
                <div>
                  <div className="text-sm font-medium text-ink">
                    {scan.orphans.length} fichier{scan.orphans.length > 1 ? 's' : ''} orphelin{scan.orphans.length > 1 ? 's' : ''}
                  </div>
                  <div className="text-[11px] text-ink/60 mt-0.5">
                    {formatSize(scan.totalOrphanSize)} d'espace récupérable
                  </div>
                </div>
                <button
                  type="button"
                  onClick={deleteAll}
                  disabled={deleting}
                  className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 bg-terracotta text-ivory hover:opacity-90 disabled:opacity-50 transition"
                >
                  🗑️ Tout supprimer
                </button>
              </div>
              <ul className="divide-y divide-linen">
                {scan.orphans.map((o) => (
                  <li key={o.filename} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-ink/85 truncate font-mono">{o.filename}</div>
                      <div className="text-[10px] text-ink/40 mt-0.5">
                        {formatSize(o.size)} · {new Date(o.mtime).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteOne(o.filename)}
                      disabled={deleting}
                      className="text-[10px] uppercase tracking-[0.22em] px-3 py-1.5 border border-terracotta text-terracotta hover:bg-terracotta hover:text-ivory disabled:opacity-40 transition flex-shrink-0"
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </motion.div>
    </>
  )
}



export default MediaLibrary
export { TagEditorModal, OrphanCleanupModal }
