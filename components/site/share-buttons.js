'use client'

import { useState } from 'react'
import { Instagram, Link2, Check } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Boutons de partage — Pinterest, Instagram (@atelier_jlt), copie du lien.
 * Le partage vers Instagram web n'existe pas nativement pour un lien ;
 * on renvoie donc vers le compte @atelier_jlt (nouvel onglet) et on
 * copie automatiquement le lien de l'article dans le presse-papier
 * pour faciliter le partage en story ou en DM.
 */
export default function ShareButtons({ url, title, image }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? new URL(url, window.location.origin).toString()
    : url

  const pinterestHref = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(image || '')}&description=${encodeURIComponent(title)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Lien copié dans le presse-papier')
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback : sélection manuelle
      toast.error('Impossible de copier — sélectionnez le lien manuellement')
    }
  }

  const openInstagram = async () => {
    // Copie le lien puis ouvre le profil Instagram — un DM ou une story
    // pourra ainsi coller le lien collé automatiquement.
    try { await navigator.clipboard.writeText(shareUrl) } catch {}
    toast.success('Lien copié — colle-le dans ta story ou en DM à @atelier_jlt')
    window.open('https://www.instagram.com/atelier_jlt/', '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="not-prose flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-y border-linen my-10">
      <span className="text-[10px] uppercase tracking-[0.28em] text-ink/50">Partager</span>
      <div className="flex flex-wrap items-center gap-2">
        {/* Pinterest */}
        <a
          href={pinterestHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Épingler sur Pinterest"
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink/25 text-[11px] uppercase tracking-[0.22em] text-ink hover:border-emerald hover:text-emerald transition"
        >
          {/* Icône Pinterest inline (lucide n’en fournit pas) */}
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.372 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.024 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.223.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
          </svg>
          Pinterest
        </a>

        {/* Instagram — @atelier_jlt */}
        <button
          type="button"
          onClick={openInstagram}
          aria-label="Partager avec @atelier_jlt sur Instagram"
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink/25 text-[11px] uppercase tracking-[0.22em] text-ink hover:border-emerald hover:text-emerald transition"
        >
          <Instagram className="h-4 w-4" strokeWidth={1.5} />
          @atelier_jlt
        </button>

        {/* Copier le lien */}
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copier le lien de l’article"
          className="inline-flex items-center gap-2 px-4 py-2 border border-ink/25 text-[11px] uppercase tracking-[0.22em] text-ink hover:border-emerald hover:text-emerald transition"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald" strokeWidth={1.5} />
              Copié
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4" strokeWidth={1.5} />
              Copier le lien
            </>
          )}
        </button>
      </div>
    </div>
  )
}
