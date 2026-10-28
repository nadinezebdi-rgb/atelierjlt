'use client'

/** Fiche produit (admin) : adresse web modifiable + aperçu du résultat Google. */
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link2, Check, AlertCircle, Loader2 } from 'lucide-react'

const slugify = (str) => String(str || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70).replace(/-+$/g, '')

const LEGACY = ['racine', 'empreinte']
const suggest = (name) => slugify(name).split('-').filter((w) => w && !LEGACY.includes(w)).join('-')

export default function ProductSlugEditor({ product, name, story, onChanged }) {
  const [value, setValue] = useState(product.slug)
  const [check, setCheck] = useState({ state: 'idle' }) // idle | checking | ok | error
  const [saving, setSaving] = useState(false)
  const site = useMemo(() => {
    const base = (process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')
    try { return { base, host: new URL(base).host.replace(/^www\./, '') } } catch { return { base, host: 'atelierjlt.fr' } }
  }, [])

  const clean = slugify(value)
  const changed = clean && clean !== product.slug
  const proposal = suggest(name)

  useEffect(() => { setValue(product.slug) }, [product.slug])

  useEffect(() => {
    if (!changed) { setCheck({ state: 'idle' }); return }
    setCheck({ state: 'checking' })
    const id = setTimeout(async () => {
      const r = await fetch('/api/admin/products/slug', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: product.slug, newSlug: clean, dryRun: true }),
      }).catch(() => null)
      const d = await r?.json().catch(() => ({}))
      setCheck(r?.ok ? { state: 'ok' } : { state: 'error', error: d?.error || 'Vérification impossible' })
    }, 400)
    return () => clearTimeout(id)
  }, [clean, changed, product.slug])

  const apply = async () => {
    if (!confirm(`Changer l’adresse en « /produit/${clean} » ?\n\nL’ancienne adresse redirigera automatiquement vers la nouvelle.`)) return
    setSaving(true)
    const r = await fetch('/api/admin/products/slug', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: product.slug, newSlug: clean }),
    })
    const d = await r.json().catch(() => ({}))
    setSaving(false)
    if (!r.ok) return toast.error(d.error || 'Changement impossible')
    toast.success(`Nouvelle adresse : /produit/${d.slug}`)
    onChanged?.(d.slug)
  }

  const title = `${name || product.name} · Atelier JLT`
  const desc = String(story || product.story || '').replace(/\s+/g, ' ').trim()
  const shortDesc = desc.length > 155 ? desc.slice(0, 152).replace(/\s+\S*$/, '').replace(/[\s.,;:!?…]+$/, '') + '…' : desc

  return (
    <div className="mt-6 border border-linen bg-ivory p-4" data-testid="slug-editor">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">
        <Link2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Adresse web
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[260px] flex items-center border-b border-ink/20 focus-within:border-ink">
          <span className="text-sm text-ink/45 whitespace-nowrap">{site.host}/produit/</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setValue(clean || product.slug)}
            data-testid="slug-input"
            className="flex-1 min-w-0 bg-transparent py-2 text-sm outline-none"
            spellCheck={false}
          />
        </div>
        <button
          type="button" onClick={apply}
          disabled={!changed || check.state !== 'ok' || saving}
          data-testid="slug-apply"
          className="h-10 px-4 bg-ink text-ivory text-[10px] uppercase tracking-[0.2em] hover:bg-terracotta disabled:opacity-40"
        >
          {saving ? 'Changement…' : 'Changer l’adresse'}
        </button>
      </div>
      <div className="mt-2 text-xs min-h-[18px]">
        {check.state === 'checking' && <span className="text-ink/50 inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Vérification…</span>}
        {check.state === 'ok' && <span className="text-emerald inline-flex items-center gap-1" data-testid="slug-ok"><Check className="h-3 w-3" /> Adresse disponible — l’ancienne redirigera vers la nouvelle</span>}
        {check.state === 'error' && <span className="text-terracotta inline-flex items-center gap-1" data-testid="slug-error"><AlertCircle className="h-3 w-3" /> {check.error}</span>}
        {check.state === 'idle' && proposal && proposal !== product.slug && (
          <button type="button" onClick={() => setValue(proposal)} className="text-ink/60 underline underline-offset-2 hover:text-emerald" data-testid="slug-suggest">
            Proposition d’après le nom : {proposal}
          </button>
        )}
        {check.state === 'idle' && (!proposal || proposal === product.slug) && <span className="text-ink/45">Lettres minuscules, chiffres et tirets. Les accents sont retirés automatiquement.</span>}
      </div>

      {/* Aperçu Google */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-[0.24em] text-ink/50 mb-2">Aperçu dans Google</div>
        <div className="bg-white border border-linen rounded-md p-4 max-w-[600px]" style={{ fontFamily: 'Arial, sans-serif' }} data-testid="google-preview">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[11px] font-bold text-emerald">JLT</div>
            <div className="leading-tight min-w-0">
              <div className="text-[14px] text-[#202124]">Atelier JLT</div>
              <div className="text-[12px] text-[#4D5156] truncate">https://{site.host} › produit › {clean || product.slug}</div>
            </div>
          </div>
          <div className="mt-1.5 text-[20px] leading-snug text-[#1A0DAB] truncate">{title}</div>
          <div className="mt-1 text-[14px] leading-[1.58] text-[#4D5156] line-clamp-2">{shortDesc || 'Ajoutez une description narrative pour qu’elle apparaisse ici.'}</div>
        </div>
        <p className="text-[11px] text-ink/45 mt-1.5">Le titre vient du nom du produit, le texte de la description narrative. Google peut l’afficher un peu différemment.</p>
      </div>
    </div>
  )
}
