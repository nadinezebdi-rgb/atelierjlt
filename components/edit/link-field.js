'use client'

import { NAV_PAGE_OPTIONS } from '@/lib/navbar'

export default function LinkField({ value = '', onChange, products = [] }) {
  const options = [...NAV_PAGE_OPTIONS, ...products.map((p) => ({ href: `/produit/${p.slug}`, label: `Produit — ${p.name}` }))]
  const known = options.some((option) => option.href === value)
  return (
    <div className="space-y-2">
      <label className="block"><span className="block text-sm mb-1">Page de destination</span>
        <select value={known ? value : ''} onChange={(e) => onChange(e.target.value)} className="w-full border border-ink/20 bg-ivory px-3 py-2">
          <option value="">Choisir une page</option>
          {options.map((option) => <option key={option.href} value={option.href}>{option.label}</option>)}
        </select>
      </label>
      <details open={!!value && !known}><summary className="cursor-pointer text-sm">Lien personnalisé</summary>
        <label className="block mt-2"><span className="block text-sm mb-1">Adresse du lien</span><input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… ou /page" className="w-full border border-ink/20 px-3 py-2" /></label>
      </details>
    </div>
  )
}
