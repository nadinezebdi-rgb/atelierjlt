'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'
import Logo from './logo'
import { FOOTER_DEFAULTS, LEGAL_PAGES, LEGAL_SLUGS, mergeFooter } from '@/lib/legal-defaults'
import { openCookieSettings } from './cookie-banner'

// Le contenu du footer se modifie dans /admin → Footer & pages légales.
let footerCache = null

export default function Footer() {
  const [f, setF] = useState(() => footerCache || mergeFooter(null))
  useEffect(() => {
    if (footerCache) return
    fetch('/api/site-pages/footer')
      .then((r) => r.json())
      .then((d) => {
        if (d?.footer) {
          footerCache = d.footer
          setF(d.footer)
        }
      })
      .catch(() => {})
  }, [])

  const clientItems = [['Mon compte', '/compte']]
  for (const k of LEGAL_SLUGS) {
    const l = f.clientLinks?.[k] || FOOTER_DEFAULTS.clientLinks[k]
    if (l?.show !== false) clientItems.push([l?.label || LEGAL_PAGES[k].menuLabel, LEGAL_PAGES[k].path])
  }

  return (
    <footer className="bg-ink text-ivory pt-20 pb-8" data-testid="site-footer">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-2 pr-6">
            <div className="mb-2">
              <Logo variant="light" size="lg" />
            </div>
            {f.tagline && (
              <p className="mt-6 text-sm leading-relaxed text-ivory/70 max-w-sm whitespace-pre-line">{f.tagline}</p>
            )}
            {f.email && (
              <a href={`mailto:${f.email}`} className="inline-block mt-4 text-sm text-ivory/80 hover:text-terracotta transition-colors">
                {f.email}
              </a>
            )}
            <div className="flex gap-4 mt-6">
              {f.instagram && <a href={f.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:opacity-70 transition"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>}
              {f.facebook && <a href={f.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:opacity-70 transition"><Facebook className="h-4 w-4" strokeWidth={1.5} /></a>}
            </div>
          </div>
          <FooterCol title="Maison" items={[
            ['À propos', '/a-propos'],
            ['Journal', '/journal'],
            ['Contact', '/contact'],
          ]} />
          <FooterCol title="Boutique" items={[
            ['Tous les produits', '/produits'],
            ['Nouveautés', '/produits?cat=nouveautes'],
            ['Éditions limitées', '/produits?cat=editions-limitees'],
            ['Cartes cadeaux', '/carte-cadeau'],
          ]} />
          <FooterCol title="Client" items={clientItems} />
        </div>
        <div className="mt-16 pt-6 border-t border-ivory/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.3em] text-ivory/50 text-center">
          <span>© {new Date().getFullYear()} {f.copyright}</span>
          <button type="button" onClick={openCookieSettings} className="uppercase tracking-[0.3em] hover:text-ivory transition" data-testid="manage-cookies">
            Gérer les cookies
          </button>
          {f.bottomNote && <span>{f.bottomNote}</span>}
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-ivory/50 mb-4">{title}</div>
      <ul className="space-y-2.5 text-sm text-ivory/80">
        {items.map(([label, href]) => (
          <li key={href}><Link href={href} className="hover:text-terracotta transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
