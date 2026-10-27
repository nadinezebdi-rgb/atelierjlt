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
