'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Upload, FolderOpen, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import MediaPickerModal from './media-picker-modal'

function ImageUploader({ images, onChange, accept = 'images' }) {
  const [uploading, setUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)

  // accept: 'images' (par défaut) | 'all' (images + mp4 + pdf)
  const acceptAttr = accept === 'all'
    ? 'image/png,image/jpeg,image/webp,video/mp4,video/webm,video/quicktime,application/pdf'
    : 'image/png,image/jpeg,image/webp'

  const handleFiles = async (files) => {
    if (!files || !files.length) return
    setUploading(true)
    const uploaded = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const r = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd })
        const d = await r.json()
        if (r.ok && d.url) uploaded.push(d.url)
        else toast.error(d.error || 'Upload échoué')
      } catch (e) {
        toast.error('Upload échoué')
      }
    }
    setUploading(false)
    if (uploaded.length) {
      onChange([...(images || []), ...uploaded])
      toast.success(`${uploaded.length} fichier(s) ajouté(s)`)
    }
  }

  const remove = (idx) => onChange(images.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const next = [...images]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(next)
  }

  // Type detection depuis l'URL
  const kindOf = (url) => {
    if (!url) return 'unknown'
    if (url.match(/\.(mp4|webm|mov)$/i) || url.includes('/api/file/') && url.match(/\.(mp4|webm|mov)/i)) return 'video'
    if (url.match(/\.pdf$/i) || (url.includes('/api/file/') && url.match(/\.pdf/i))) return 'pdf'
    return 'image'
  }

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
        {(images || []).map((url, i) => {
          const kind = kindOf(url)
          const isDragging = dragIdx === i
          const isOver = overIdx === i && dragIdx !== i
          return (
            <div
              key={url + i}
              draggable
              onDragStart={(e) => {
                setDragIdx(i)
                e.dataTransfer.effectAllowed = 'move'
                try { e.dataTransfer.setData('text/plain', String(i)) } catch {}
              }}
              onDragOver={(e) => { e.preventDefault(); if (i !== overIdx) setOverIdx(i) }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return }
                const next = images.slice()
                const [moved] = next.splice(dragIdx, 1)
                next.splice(i, 0, moved)
                onChange(next)
                setDragIdx(null); setOverIdx(null)
              }}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
              className={cn(
                'relative aspect-square bg-cream border group overflow-hidden cursor-grab active:cursor-grabbing transition',
                'border-linen',
                isDragging && 'opacity-40',
                isOver && 'ring-2 ring-emerald ring-offset-2 ring-offset-ivory'
              )}
            >
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : kind === 'video' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-ink/5 text-ink/70">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2"/>
                  </svg>
                  <span className="text-[9px] uppercase tracking-[0.22em] mt-1">Vidéo</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-ink/5 text-ink/70">
                  <FileText className="h-8 w-8" strokeWidth={1.5} />
                  <span className="text-[9px] uppercase tracking-[0.22em] mt-1">PDF</span>
                </div>
              )}
              <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2 text-ivory">
                <div className="flex gap-1 text-[10px]">
                  <button type="button" onClick={() => move(i, -1)} className="bg-ivory/20 px-2 py-1 hover:bg-ivory/40 disabled:opacity-30" disabled={i === 0}>◀</button>
                  <button type="button" onClick={() => move(i, 1)} className="bg-ivory/20 px-2 py-1 hover:bg-ivory/40 disabled:opacity-30" disabled={i === (images.length - 1)}>▶</button>
                </div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="bg-ivory/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] hover:bg-ivory/40">Voir</a>
                <button type="button" onClick={() => remove(i)} className="bg-brique px-3 py-1 text-[10px] uppercase tracking-[0.2em]">Retirer</button>
              </div>
              {i === 0 && kind === 'image' && <span className="absolute top-1 left-1 bg-emerald text-ivory text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5">Principal</span>}
            </div>
          )
        })}
        <label className="aspect-square bg-cream border border-dashed border-ink/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald hover:text-emerald transition text-ink/50 text-[10px] uppercase tracking-[0.22em] text-center px-2">
          <Upload className="h-5 w-5" strokeWidth={1.5} />
          {uploading ? 'Envoi…' : (accept === 'all' ? 'Télécharger' : 'Ajouter')}
          {accept === 'all' && !uploading && (
            <span className="text-[8px] normal-case tracking-normal text-ink/40">
              PNG · JPG · MP4 · PDF
            </span>
          )}
          <input
            type="file"
            multiple
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
          />
        </label>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="aspect-square bg-cream border border-dashed border-ink/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-emerald hover:text-emerald transition text-ink/50 text-[10px] uppercase tracking-[0.22em] text-center px-2"
        >
          <FolderOpen className="h-5 w-5" strokeWidth={1.5} />
          Bibliothèque
          <span className="text-[8px] normal-case tracking-normal text-ink/40">
            Choisir un fichier existant
          </span>
        </button>
      </div>
      <details className="text-[11px] text-ink/50">
        <summary className="cursor-pointer hover:text-ink">Ou coller des URLs (une par ligne)</summary>
        <textarea
          rows={3}
          value={(images || []).join('\n')}
          onChange={(e) => onChange(e.target.value.split('\n').filter(Boolean))}
          className="w-full mt-2 bg-transparent border border-ink/15 p-3 focus:outline-none focus:border-ink text-sm font-mono"
        />
      </details>

      <AnimatePresence>
        {pickerOpen && (
          <MediaPickerModal
            multiSelect
            kindFilter={accept === 'all' ? 'all' : 'image'}
            onClose={() => setPickerOpen(false)}
            onPickMany={(urls) => {
              onChange([...(images || []), ...urls])
              setPickerOpen(false)
              toast.success(`${urls.length} fichier${urls.length > 1 ? 's ajoutés' : ' ajouté'} depuis la bibliothèque`)
            }}
            excludeUrls={images || []}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImageUploader
