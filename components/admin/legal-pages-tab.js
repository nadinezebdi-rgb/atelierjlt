'use client'

/**
 * Admin → Footer & pages légales
 *   - Footer : texte de présentation, email, réseaux, liens « Client » (nom + afficher/masquer)
 *   - Pages : CGV, Livraison & retours, Suivi de commande, Confidentialité (RGPD)
 *     → titre, introduction, parties (titre + texte), ajout / suppression / ordre
 */
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Eye, Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, Save } from 'lucide-react'
import { LEGAL_PAGES, LEGAL_SLUGS } from '@/lib/legal-defaults'
import { NAV_PAGE_OPTIONS, NAVBAR_DEFAULTS, NAVBAR_OPTION_DEFAULTS } from '@/lib/navbar'
import { ImageField } from '@/components/edit/section-fields'

const INPUT = 'w-full bg-ivory border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-emerald rounded-sm'
const LABEL = 'block text-[10px] uppercase tracking-[0.26em] text-ink/60 mb-2'

export default function LegalPagesTab() {
  const [data, setData] = useState(null)
  const [dirty, setDirty] = useState({})
  const [saving, setSaving] = useState('')
  const [open, setOpen] = useState('navbar')

  useEffect(() => {
    fetch('/api/admin/site-pages', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setData({ footer: d.footer, navbar: d.navbar, ...d.pages }))
      .catch(() => toast.error('Chargement impossible'))
  }, [])

  useEffect(() => {
    const any = Object.values(dirty).some(Boolean)
    const warn = (e) => { if (any) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  if (!data) return <div className="text-ink/50">Chargement…</div>

  const set = (key, next) => {
    setData((d) => ({ ...d, [key]: next }))
    setDirty((x) => ({ ...x, [key]: true }))
  }
  const save = async (key) => {
    setSaving(key)
    const r = await fetch(`/api/admin/site-pages/${key}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data[key]),
    })
    setSaving('')
    if (r.ok) {
      setDirty((x) => ({ ...x, [key]: false }))
      toast.success('Enregistré — visible tout de suite sur le site')
    } else toast.error('Erreur à l’enregistrement')
  }

  return (
    <div className="space-y-4" data-testid="admin-legal-tab">
      <div className="mb-6">
        <h2 className="font-display text-3xl">Menu, footer & pages</h2>
        <p className="text-sm text-ink/60 mt-2 max-w-2xl leading-relaxed">
          Modifiez le menu du haut, le bas de page du site, le texte du bandeau cookies et les pages CGV, Livraison & retours, Suivi de commande, Confidentialité (RGPD) et Mentions légales.
          Chaque bloc s’enregistre séparément.
        </p>
      </div>

      <Card
        id="navbar"
        title="Menu de navigation (navbar)"
        subtitle="Les liens affichés en haut du site — nom, page reliée, ordre"
        open={open === 'navbar'}
        onToggle={() => setOpen(open === 'navbar' ? '' : 'navbar')}
        dirty={dirty.navbar}
        saving={saving === 'navbar'}
        onSave={() => save('navbar')}
      >
        <NavbarEditor value={data.navbar} onChange={(v) => set('navbar', v)} />
      </Card>

      <Card
        id="footer"
        title="Footer (bas de page)"
        subtitle="Présentation, email, réseaux sociaux et liens « Client »"
        open={open === 'footer'}
        onToggle={() => setOpen(open === 'footer' ? '' : 'footer')}
        dirty={dirty.footer}
        saving={saving === 'footer'}
        onSave={() => save('footer')}
      >
        <FooterEditor value={data.footer} onChange={(v) => set('footer', v)} />
      </Card>

      {LEGAL_SLUGS.map((slug) => (
        <Card
          key={slug}
          id={slug}
          title={data[slug]?.title || LEGAL_PAGES[slug].title}
          subtitle={`Page ${LEGAL_PAGES[slug].path}`}
          href={LEGAL_PAGES[slug].path}
          open={open === slug}
          onToggle={() => setOpen(open === slug ? '' : slug)}
          dirty={dirty[slug]}
          saving={saving === slug}
          onSave={() => save(slug)}
          warning={hasPlaceholders(data[slug]) ? 'Des mentions [entre crochets] restent à compléter.' : ''}
        >
          <PageEditor value={data[slug]} onChange={(v) => set(slug, v)} />
        </Card>
      ))}
    </div>
  )
}

function hasPlaceholders(p) {
  if (!p) return false
  const all = [p.title, p.intro, ...(p.sections || []).flatMap((s) => [s.title, s.text])].join(' ')
  return /\[[^\]]*compl[ée]ter[^\]]*\]/i.test(all)
}

function Card({ id, title, subtitle, href, open, onToggle, dirty, saving, onSave, warning, children }) {
  return (
    <section className="border border-linen bg-ivory" data-testid={`legal-card-${id}`}>
      <div className="flex flex-wrap items-center gap-3 p-5">
        <button type="button" onClick={onToggle} className="flex-1 min-w-[200px] flex items-center gap-3 text-left min-h-[44px]">
          <ChevronDown className={`h-4 w-4 text-emerald transition-transform ${open ? 'rotate-180' : ''}`} strokeWidth={1.8} />
          <span>
            <span className="block font-display text-lg leading-tight">{title}</span>
            <span className="block text-[11px] text-ink/50 mt-0.5">{subtitle}</span>
          </span>
        </button>
        {warning && (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-terracotta"><AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.8} /> À compléter</span>
        )}
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-[0.22em] text-ink/60 hover:text-emerald inline-flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> Voir
          </a>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={!dirty || saving}
          data-testid={`legal-save-${id}`}
          className="h-11 px-4 bg-emerald text-ivory text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2 hover:bg-emeraldDark disabled:opacity-35"
        >
          <Save className="h-4 w-4" strokeWidth={1.5} /> {saving ? 'Enregistrement…' : dirty ? 'Enregistrer' : 'Enregistré'}
        </button>
      </div>
      {open && (
        <div className="border-t border-linen/70 bg-cream/20 p-5 md:p-6">
          {warning && <p className="mb-5 text-xs text-terracotta">{warning}</p>}
          {children}
        </div>
      )}
    </section>
  )
}

function FooterEditor({ value, onChange }) {
  const v = value || {}
  const upd = (k, val) => onChange({ ...v, [k]: val })
  const updLink = (slug, patch) => onChange({ ...v, clientLinks: { ...(v.clientLinks || {}), [slug]: { ...(v.clientLinks?.[slug] || {}), ...patch } } })
  return (
    <div className="grid md:grid-cols-2 gap-5">
      <label className="block md:col-span-2">
        <span className={LABEL}>Texte de présentation</span>
        <textarea rows={3} value={v.tagline || ''} onChange={(e) => upd('tagline', e.target.value)} className={INPUT} />
      </label>
      <label className="block"><span className={LABEL}>Email affiché</span><input value={v.email || ''} onChange={(e) => upd('email', e.target.value)} className={INPUT} /></label>
      <label className="block"><span className={LABEL}>Texte bas de page (droite)</span><input value={v.bottomNote || ''} onChange={(e) => upd('bottomNote', e.target.value)} className={INPUT} placeholder="Paiement sécurisé" /></label>
      <label className="block"><span className={LABEL}>Lien Instagram</span><input value={v.instagram || ''} onChange={(e) => upd('instagram', e.target.value)} className={INPUT} placeholder="https://www.instagram.com/…" /></label>
      <label className="block"><span className={LABEL}>Lien Facebook</span><input value={v.facebook || ''} onChange={(e) => upd('facebook', e.target.value)} className={INPUT} placeholder="https://www.facebook.com/…" /></label>
      <label className="block md:col-span-2"><span className={LABEL}>Copyright (après © année)</span><input value={v.copyright || ''} onChange={(e) => upd('copyright', e.target.value)} className={INPUT} /></label>
      <label className="block md:col-span-2"><span className={LABEL}>Texte du bandeau cookies</span><textarea rows={3} value={v.cookieText || ''} onChange={(e) => upd('cookieText', e.target.value)} className={INPUT} /></label>

      <div className="md:col-span-2 pt-2">
        <span className={LABEL}>Liens de la colonne « Client »</span>
        <div className="space-y-2">
          {LEGAL_SLUGS.map((slug) => {
            const l = v.clientLinks?.[slug] || {}
            const show = l.show !== false
            return (
              <div key={slug} className="flex items-center gap-3 border border-linen bg-ivory p-2">
                <input value={l.label || ''} onChange={(e) => updLink(slug, { label: e.target.value })} placeholder={LEGAL_PAGES[slug].menuLabel} className={`${INPUT} flex-1`} />
                <span className="hidden sm:block text-[11px] text-ink/45 w-32 truncate">{LEGAL_PAGES[slug].path}</span>
                <button
                  type="button"
                  onClick={() => updLink(slug, { show: !show })}
                  aria-pressed={show}
                  className={`h-10 px-3 text-[10px] uppercase tracking-[0.18em] border min-w-[92px] ${show ? 'border-emerald text-emerald' : 'border-ink/20 text-ink/45'}`}
                >
                  {show ? 'Affiché' : 'Masqué'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PageEditor({ value, onChange }) {
  const v = value || {}
  const sections = Array.isArray(v.sections) ? v.sections : []
  const setSections = (next) => onChange({ ...v, sections: next })
  const updSection = (i, patch) => setSections(sections.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = sections.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setSections(next)
  }
  return (
    <div className="space-y-5">
      <label className="block"><span className={LABEL}>Titre de la page</span><input value={v.title || ''} onChange={(e) => onChange({ ...v, title: e.target.value })} className={INPUT} /></label>
      <label className="block"><span className={LABEL}>Introduction</span><textarea rows={3} value={v.intro || ''} onChange={(e) => onChange({ ...v, intro: e.target.value })} className={INPUT} /></label>

      <div>
        <span className={LABEL}>Parties de la page ({sections.length})</span>
        <p className="text-[11px] text-ink/50 mb-3">Astuce : commencez une ligne par « - » pour faire une liste à puces. Laissez une ligne vide pour un nouveau paragraphe.</p>
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={i} className="border border-linen bg-ivory p-3 space-y-2" data-testid={`legal-section-${i}`}>
              <div className="flex items-center gap-2">
                <input value={s.title || ''} onChange={(e) => updSection(i, { title: e.target.value })} placeholder="Titre de la partie" className={`${INPUT} flex-1 font-medium`} />
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="h-10 w-10 flex items-center justify-center border border-ink/10 hover:border-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="Descendre" className="h-10 w-10 flex items-center justify-center border border-ink/10 hover:border-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => { if (confirm('Supprimer cette partie ?')) setSections(sections.filter((_, j) => j !== i)) }} aria-label="Supprimer" className="h-10 w-10 flex items-center justify-center text-terracotta hover:bg-terracotta/10"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
              </div>
              <textarea rows={Math.min(12, Math.max(3, String(s.text || '').split('\n').length + 1))} value={s.text || ''} onChange={(e) => updSection(i, { text: e.target.value })} placeholder="Texte de la partie" className={INPUT} />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setSections([...sections, { title: 'Nouvelle partie', text: '' }])}
          data-testid="legal-add-section"
          className="mt-3 h-11 px-4 border border-dashed border-ink/30 hover:border-emerald hover:text-emerald text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Ajouter une partie
        </button>
      </div>
    </div>
  )
}

export function NavbarEditor({ value, onChange }) {
  const items = Array.isArray(value?.items) ? value.items : []
  const opt = { ...NAVBAR_OPTION_DEFAULTS, ...(value?.options || {}) }
  const setOpt = (patch) => onChange({ ...(value || {}), options: { ...opt, ...patch } })
  const setItems = (next) => onChange({ ...(value || {}), items: next })
  const upd = (i, patch) => setItems(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = items.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setItems(next)
  }
  const known = new Set(NAV_PAGE_OPTIONS.map((o) => o.href))
  return (
    <div className="space-y-3" data-testid="navbar-editor">
      <p className="text-xs text-ink/55 leading-relaxed">
        Chaque ligne = un titre du menu. Choisissez la page vers laquelle il mène : le titre est ainsi toujours relié à la bonne page. Le lien en cours est souligné en vert sur le site.
      </p>
      {items.map((it, i) => {
        const custom = !known.has(it.href)
        return (
          <div key={i} className={`border bg-ivory p-3 grid sm:grid-cols-[1fr_1.3fr_auto] gap-2 items-center ${it.show === false ? 'border-dashed border-ink/20 opacity-70' : 'border-linen'}`} data-testid={`nav-item-${i}`}>
            <input value={it.label || ''} onChange={(e) => upd(i, { label: e.target.value })} placeholder="Titre du menu" className={INPUT} aria-label="Titre du menu" />
            <div className="space-y-2">
              <select
                value={custom ? '__custom' : it.href}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__custom') return upd(i, { href: '' })
                  const opt = NAV_PAGE_OPTIONS.find((o) => o.href === v)
                  upd(i, { href: v, ...(it.label ? {} : { label: opt?.label || '' }) })
                }}
                className={INPUT}
                aria-label="Page reliée"
              >
                {NAV_PAGE_OPTIONS.map((o) => <option key={o.href} value={o.href}>{o.label}</option>)}
                <option value="__custom">Autre lien…</option>
              </select>
              {custom && (
                <input value={it.href || ''} onChange={(e) => upd(i, { href: e.target.value })} placeholder="/ma-page ou https://…" className={INPUT} aria-label="Lien personnalisé" />
              )}
            </div>
            <div className="flex items-center gap-1 justify-end">
              <button type="button" onClick={() => upd(i, { show: it.show === false })} className={`h-10 px-2 text-[10px] uppercase tracking-[0.16em] border min-w-[78px] ${it.show !== false ? 'border-emerald text-emerald' : 'border-ink/20 text-ink/45'}`} aria-pressed={it.show !== false}>
                {it.show !== false ? 'Affiché' : 'Masqué'}
              </button>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="h-10 w-10 flex items-center justify-center border border-ink/10 hover:border-ink disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Descendre" className="h-10 w-10 flex items-center justify-center border border-ink/10 hover:border-ink disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => { if (confirm('Retirer ce lien du menu ?')) setItems(items.filter((_, j) => j !== i)) }} aria-label="Supprimer" className="h-10 w-10 flex items-center justify-center text-terracotta hover:bg-terracotta/10"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
            </div>
          </div>
        )
      })}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setItems([...items, { label: 'Nouveau lien', href: '/', show: true }])} data-testid="nav-add" className="h-11 px-4 border border-dashed border-ink/30 hover:border-emerald hover:text-emerald text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-2">
          <Plus className="h-4 w-4" strokeWidth={1.5} /> Ajouter un lien
        </button>
        <button type="button" onClick={() => { if (confirm('Revenir au menu par défaut ?')) setItems(NAVBAR_DEFAULTS.items.map((x) => ({ ...x }))) }} className="h-11 px-4 border border-ink/20 hover:border-ink text-[11px] uppercase tracking-[0.2em]">
          Menu par défaut
        </button>
      </div>

      {/* Réglages d'affichage de la barre */}
      <div className="pt-5 mt-2 border-t border-linen space-y-4" data-testid="navbar-options">
        <span className={LABEL}>Affichage de la barre</span>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
          {[
            ['visible', 'Afficher la ligne de liens (ordinateur)'],
            ['sticky', 'Barre fixe en haut pendant le défilement'],
            ['showArrows', 'Flèches page précédente / suivante'],
            ['showWishlist', 'Icône Favoris'],
            ['showAccount', 'Icône Mon compte'],
            ['showCart', 'Panier'],
          ].map(([k, label]) => (
            <label key={k} className="flex items-center justify-between gap-3 py-2 border-b border-linen/60 cursor-pointer select-none">
              <span className="text-sm text-ink/80">{label}</span>
              <input type="checkbox" checked={!!opt[k]} onChange={(e) => setOpt({ [k]: e.target.checked })} className="h-5 w-5 accent-emerald" data-testid={`navopt-${k}`} />
            </label>
          ))}
        </div>
        {!opt.showCart && <p className="text-[11px] text-terracotta">Sans le panier, les clients ne peuvent plus voir leur panier depuis la barre.</p>}
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <span className={LABEL}>Position des liens</span>
            <div className="flex gap-1 p-1 bg-cream">
              {[['left', 'Gauche'], ['center', 'Centre'], ['right', 'Droite']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setOpt({ linksAlign: v })} className={`flex-1 h-10 text-[11px] uppercase tracking-[0.18em] ${opt.linksAlign === v ? 'bg-ink text-ivory' : 'text-ink/60 hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div>
            <span className={LABEL}>Taille du logo</span>
            <div className="flex gap-1 p-1 bg-cream">
              {[['md', 'Moyen'], ['lg', 'Grand']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setOpt({ logoSize: v })} className={`flex-1 h-10 text-[11px] uppercase tracking-[0.18em] ${opt.logoSize === v ? 'bg-ink text-ivory' : 'text-ink/60 hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <span className={LABEL}>Logo (image facultative — sinon le logo texte « Atelier JLT »)</span>
          <ImageField value={opt.logoImage} onChange={(url) => setOpt({ logoImage: url || '' })} />
        </div>
      </div>
    </div>
  )
}
