'use client'

/**
 * Bandeau cookies (recommandations CNIL) :
 *   - « Tout refuser » aussi visible que « Tout accepter »
 *   - « Personnaliser » par catégorie (les cookies nécessaires restent actifs)
 *   - choix conservé 6 mois (cookie jlt_consent), modifiable via « Gérer les cookies »
 *
 * Pour un futur script (ex. mesure d'audience) : n'exécuter que si
 *   hasCookieConsent('analytics') === true, et écouter l'événement 'jlt:consent'.
 */
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FOOTER_DEFAULTS } from '@/lib/legal-defaults'

const COOKIE = 'jlt_consent'
const MAX_AGE = 60 * 60 * 24 * 182 // ~6 mois

export function readCookieConsent() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + COOKIE + '=([^;]*)'))
  if (!m) return null
  try { return JSON.parse(decodeURIComponent(m[1])) } catch { return null }
}

export function hasCookieConsent(category) {
  const c = readCookieConsent()
  return !!c?.[category]
}

export function openCookieSettings() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('jlt:open-cookies'))
}

function writeConsent(choice) {
  const value = { necessary: true, analytics: !!choice.analytics, marketing: !!choice.marketing, date: new Date().toISOString() }
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(new CustomEvent('jlt:consent', { detail: value }))
  return value
}

export default function CookieBanner() {
  const pathname = usePathname() || ''
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(false)
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false })
  const [text, setText] = useState(FOOTER_DEFAULTS.cookieText)

  useEffect(() => {
    const existing = readCookieConsent()
    if (!existing) setOpen(true)
    else setPrefs({ analytics: !!existing.analytics, marketing: !!existing.marketing })
    const reopen = () => {
      const c = readCookieConsent()
      if (c) setPrefs({ analytics: !!c.analytics, marketing: !!c.marketing })
      setCustom(true)
      setOpen(true)
    }
    window.addEventListener('jlt:open-cookies', reopen)
    fetch('/api/site-pages/footer').then((r) => r.json()).then((d) => d?.footer?.cookieText && setText(d.footer.cookieText)).catch(() => {})
    return () => window.removeEventListener('jlt:open-cookies', reopen)
  }, [])

  if (!open || pathname.startsWith('/admin')) return null

  const decide = (choice) => {
    writeConsent(choice)
    setOpen(false)
    setCustom(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Gestion des cookies"
      data-testid="cookie-banner"
      className="fixed z-[180] bottom-3 left-3 right-3 md:left-6 md:right-auto md:bottom-6 md:max-w-md bg-ivory text-ink border border-linen shadow-2xl p-5"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="text-[10px] uppercase tracking-[0.32em] text-emerald mb-2">Cookies</div>
      <p className="text-sm leading-relaxed text-ink/75">
        {text}{' '}
        <Link href="/confidentialite" className="underline hover:text-emerald">En savoir plus</Link>
      </p>

      {custom && (
        <div className="mt-4 space-y-2 border-t border-linen pt-4" data-testid="cookie-prefs">
          <PrefRow label="Nécessaires" hint="Panier, connexion — toujours actifs" checked disabled />
          <PrefRow label="Mesure d’audience" hint="Statistiques de visite anonymes" checked={prefs.analytics} onChange={(v) => setPrefs({ ...prefs, analytics: v })} testId="cookie-analytics" />
          <PrefRow label="Marketing" hint="Publicités personnalisées" checked={prefs.marketing} onChange={(v) => setPrefs({ ...prefs, marketing: v })} testId="cookie-marketing" />
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => decide({ analytics: false, marketing: false })} data-testid="cookie-refuse" className="h-11 border border-ink text-[11px] uppercase tracking-[0.2em] hover:bg-ink hover:text-ivory transition">
          Tout refuser
        </button>
        <button type="button" onClick={() => decide({ analytics: true, marketing: true })} data-testid="cookie-accept" className="h-11 border border-ink bg-ink text-ivory text-[11px] uppercase tracking-[0.2em] hover:bg-emerald hover:border-emerald transition">
          Tout accepter
        </button>
      </div>
      {custom ? (
        <button type="button" onClick={() => decide(prefs)} data-testid="cookie-save" className="mt-2 w-full h-10 text-[11px] uppercase tracking-[0.2em] text-emerald hover:underline">
          Enregistrer mes choix
        </button>
      ) : (
        <button type="button" onClick={() => setCustom(true)} data-testid="cookie-customize" className="mt-2 w-full h-10 text-[11px] uppercase tracking-[0.2em] text-ink/60 hover:text-ink underline-offset-4 hover:underline">
          Personnaliser
        </button>
      )}
    </div>
  )
}

function PrefRow({ label, hint, checked, onChange, disabled, testId }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-[11px] text-ink/50">{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        data-testid={testId}
        className={`relative h-6 w-11 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-emerald' : 'bg-ink/20'} ${disabled ? 'opacity-60' : ''}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 bg-ivory rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
