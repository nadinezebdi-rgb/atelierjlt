// Stock — helpers partagés (site public, admin, API).

/** Unités disponibles pour une combinaison (couleur / taille) ou pour le produit. */
export function availableUnits(p, variant, size) {
  if (!p) return 0
  const vs = Array.isArray(p.variants) ? p.variants : []
  const ss = Array.isArray(p.sizes) ? p.sizes : []
  let n = typeof p.stock === 'number' ? p.stock : Infinity
  if (variant) {
    const v = vs.find((x) => x.name === variant)
    n = Math.min(n, v ? Number(v.stock || 0) : 0)
  } else if (vs.length) {
    n = Math.min(n, vs.reduce((s, v) => s + Number(v.stock || 0), 0))
  }
  if (size) {
    const s = ss.find((x) => x.label === size)
    n = Math.min(n, s ? Number(s.stock || 0) : 0)
  } else if (ss.length) {
    n = Math.min(n, ss.reduce((s, x) => s + Number(x.stock || 0), 0))
  }
  return n === Infinity ? 99 : Math.max(0, n)
}

/** Produit entièrement épuisé (toutes couleurs / tailles confondues). */
export function isSoldOut(p) {
  return availableUnits(p) <= 0
}

export const LOW_STOCK_THRESHOLD = 2

/** Couleurs / tailles (ou produit) avec seulement 1 ou 2 pièces restantes. */
export function lowStockItems(p, threshold = LOW_STOCK_THRESHOLD) {
  if (!p) return []
  const out = []
  const low = (n) => n > 0 && n <= threshold
  for (const v of p.variants || []) if (low(Number(v.stock || 0))) out.push({ kind: 'Couleur', name: v.name, stock: Number(v.stock) })
  for (const s of p.sizes || []) if (low(Number(s.stock || 0))) out.push({ kind: 'Taille', name: s.label, stock: Number(s.stock) })
  if (!(p.variants || []).length && !(p.sizes || []).length && typeof p.stock === 'number' && low(p.stock)) {
    out.push({ kind: 'Produit', name: p.name, stock: p.stock })
  }
  return out
}

/** Écart entre le stock total saisi et la somme des couleurs / tailles. */
export function stockMismatch(p) {
  if (!p || typeof p.stock !== 'number') return null
  const vs = Array.isArray(p.variants) ? p.variants : []
  const ss = Array.isArray(p.sizes) ? p.sizes : []
  const list = vs.length ? vs : ss
  if (!list.length) return null
  const sum = list.reduce((s, x) => s + Number(x.stock || 0), 0)
  if (sum === p.stock) return null
  return { total: p.stock, sum, by: vs.length ? 'couleurs' : 'tailles' }
}

