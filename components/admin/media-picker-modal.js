'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search, FolderOpen, Film, FileText, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

function MediaPickerModal({ onClose, onPick, onPickMany, kindFilter = 'image', excludeUrls = [], multiSelect = false }) {
  const [files, setFiles] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState(kindFilter === 'all' ? 'all' : 'image')
  const [selected, setSelected] = useState([]) // array of urls in insertion order

  useEffect(() => {
    fetch('/api/admin/site-content', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFiles(d?.content?.mediaLibrary || []))
      .catch(() => setFiles([]))
  }, [])

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' o'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko'
    return (bytes / 1024 / 1024).toFixed(1) + ' Mo'
  }

  const toggleSelect = (url) => {
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  const confirmSelection = () => {
    if (selected.length === 0) return
    if (onPickMany) onPickMany(selected)
    else if (onPick) selected.forEach((u) => onPick(u))
  }

  // Filtrage : par type demandé + recherche + on retire ce qui est déjà utilisé
  const availableKinds = kindFilter === 'all' ? ['image', 'video', 'pdf'] : ['image']
  const excluded = new Set(excludeUrls)
  const filtered = (files || [])
    .filter((f) => availableKinds.includes(f.kind))
    .filter((f) => typeFilter === 'all' || f.kind === typeFilter)
    .filter((f) => !excluded.has(f.url))
    .filter((f) => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (f.originalName || f.filename || '').toLowerCase().includes(q)
    })

  const typeCounts = (files || [])
    .filter((f) => availableKinds.includes(f.kind))
    .filter((f) => !excluded.has(f.url))
    .reduce((acc, f) => { acc[f.kind] = (acc[f.kind] || 0) + 1; return acc }, {})
  const totalAvailable = Object.values(typeCounts).reduce((a, b) => a + b, 0)

  const handleCardClick = (url) => {
    if (multiSelect) toggleSelect(url)
    else onPick && onPick(url)
  }

  const selectAllVisible = () => {
    const urls = filtered.map((f) => f.url)
    setSelected((prev) => Array.from(new Set([...prev, ...urls])))
  }
  const clearSelection = () => setSelected([])

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
        className="fixed inset-x-4 top-[6vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-[6vh] md:w-[min(1080px,94vw)] max-h-[88vh] overflow-hidden flex flex-col bg-ivory z-50 shadow-2xl"
      >
        <div className="sticky top-0 bg-ivory/95 backdrop-blur border-b border-linen p-6 flex items-start justify-between gap-4 flex-shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] uppercase tracking-[0.32em] text-emerald flex items-center gap-2">
              <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} /> Bibliothèque de fichiers
            </span>
            <h3 className="font-display text-2xl mt-1">Choisir un fichier</h3>
            <p className="text-xs text-ink/60 mt-1">
              {multiSelect
                ? 'Cochez plusieurs fichiers puis validez pour tout insérer d’un coup.'
                : 'Cliquez sur un fichier pour l’insérer immédiatement.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="hover:opacity-60 transition flex-shrink-0"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {/* Barre "sélectionner tout" en multi-select */}
          {multiSelect && filtered.length > 0 && (
            <div className="flex items-center justify-between mb-4 text-[10px] uppercase tracking-[0.22em] text-ink/60">
              <span>
                {selected.length > 0 ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}` : 'Cochez pour sélectionner'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="hover:text-emerald transition"
                >
                  Tout sélectionner
                </button>
                {selected.length > 0 && (
                  <>
                    <span className="text-ink/25">·</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="hover:text-terracotta transition"
                    >
                      Tout désélectionner
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
          {/* Barre de recherche + filtres */}
          {(files || []).length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" strokeWidth={1.5} />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom…"
                  autoFocus
                  className="w-full bg-transparent border border-ink/15 pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-emerald"
                />
              </div>
              {kindFilter === 'all' && (
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'all',   label: `Tous · ${totalAvailable}` },
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
              )}
            </div>
          )}

          {/* Grille sélectionnable */}
          {files === null ? (
            <p className="text-sm text-ink/50 italic text-center py-12">Chargement…</p>
          ) : (files || []).length === 0 ? (
            <div className="border border-dashed border-ink/20 p-10 text-center">
              <FolderOpen className="h-8 w-8 mx-auto text-ink/30" strokeWidth={1.5} />
              <p className="mt-3 text-ink/60">Aucun fichier dans la bibliothèque.</p>
              <p className="mt-1 text-[11px] text-ink/40">
                Téléchargez des fichiers depuis <strong>Contenu du site → Bibliothèque de fichiers</strong>.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink/50 italic text-center py-12">
              {excluded.size > 0 && excluded.size >= totalAvailable
                ? 'Tous les fichiers disponibles sont déjà utilisés ici.'
                : 'Aucun fichier ne correspond à votre recherche.'}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map((f) => {
                const isSelected = selected.includes(f.url)
                const selectionIdx = isSelected ? selected.indexOf(f.url) + 1 : null
                return (
                  <button
                    key={f.url}
                    type="button"
                    onClick={() => handleCardClick(f.url)}
                    className={cn(
                      'group text-left border bg-ivory hover:shadow-md transition overflow-hidden relative',
                      isSelected ? 'border-emerald ring-2 ring-emerald ring-offset-2 ring-offset-ivory' : 'border-linen hover:border-emerald'
                    )}
                  >
                    <div className="relative aspect-[4/3] bg-cream overflow-hidden">
                      {f.kind === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.url} alt="" className="w-full h-full object-cover img-zoom" />
                      ) : f.kind === 'video' ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-ink/50">
                          <Film className="h-10 w-10" strokeWidth={1.5} />
                          <span className="text-[10px] uppercase tracking-[0.22em] mt-2">Vidéo</span>
                        </div>
                      ) : f.thumbnail ? (
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
                      {multiSelect ? (
                        // Badge de sélection avec ordre
                        <div className={cn(
                          'absolute top-2 right-2 h-7 w-7 rounded-full border-2 flex items-center justify-center transition',
                          isSelected
                            ? 'bg-emerald border-emerald text-ivory'
                            : 'bg-ivory/80 border-ivory group-hover:border-emerald'
                        )}>
                          {isSelected ? (
                            <span className="text-[11px] font-semibold tabular-nums">{selectionIdx}</span>
                          ) : (
                            <Check className="h-3.5 w-3.5 text-transparent group-hover:text-emerald" strokeWidth={2} />
                          )}
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-emerald/0 group-hover:bg-emerald/20 flex items-center justify-center transition">
                          <div className="opacity-0 group-hover:opacity-100 bg-emerald text-ivory text-[10px] uppercase tracking-[0.24em] px-4 py-2 transition">
                            Insérer
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-ink/80 truncate" title={f.originalName}>
                        {f.originalName || f.filename}
                      </div>
                      <div className="text-[10px] text-ink/40 tabular-nums mt-0.5">
                        {formatSize(f.size)}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Sticky footer — validation multi-select */}
        {multiSelect && (
          <div className="sticky bottom-0 bg-ivory/95 backdrop-blur border-t border-linen p-4 flex items-center justify-between gap-4 flex-shrink-0">
            <div className="text-xs text-ink/60">
              {selected.length === 0 ? (
                <span className="italic">Aucun fichier sélectionné</span>
              ) : (
                <span>
                  <strong className="text-ink">{selected.length}</strong> fichier{selected.length > 1 ? 's' : ''} à insérer
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-[11px] uppercase tracking-[0.24em] px-4 py-2 border border-ink/25 hover:bg-linen/50 transition"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmSelection}
                disabled={selected.length === 0}
                className={cn(
                  'text-[11px] uppercase tracking-[0.24em] px-6 py-2.5 transition',
                  selected.length === 0
                    ? 'bg-ink/20 text-ivory cursor-not-allowed'
                    : 'bg-emerald text-ivory hover:bg-emeraldDark'
                )}
              >
                Insérer {selected.length > 0 ? `(${selected.length})` : ''}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  )
}



export default MediaPickerModal
