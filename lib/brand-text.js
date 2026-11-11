// Nettoyage des textes de marque : plus de « Maison française », plus de
// « notre atelier français », plus de « nous » dans les libellés de liens.
// Appliqué aux textes enregistrés dans l'admin (accueil, menu, footer, pages légales).

const RULES = [
  // « Maison française »
  [/\s*[—–-]\s*Maison fran[cç]aise de d[ée]coration artisanale\.?/gi, ''],
  [/Maison fran[cç]aise de d[ée]coration artisanale\.?\s*/gi, ''],
  [/Maison fran[cç]aise\s*·\s*/gi, ''],
  [/\s*·\s*Maison fran[cç]aise/gi, ''],
  [/\bMaison fran[cç]aise\b\.?\s*/gi, ''],
  // « notre atelier français »
  [/\s+(?:dans|depuis|de|par) notre atelier fran[cç]ais/gi, ''],
  [/notre atelier fran[cç]ais/gi, 'l’atelier'],
  // « nous » dans les libellés
  [/À propos de nous/g, 'À propos'],
  [/A propos de nous/g, 'À propos'],
  [/^\s*(?:Nous contacter|Contactez-nous|Écrivez-nous)\s*$/gi, 'Contact'],
  [/^\s*Qui sommes-nous\s*\??\s*$/gi, 'À propos'],
  [/^\s*Suivez-nous\s*$/gi, 'Réseaux sociaux'],
  [/^\s*Nous écrire\s*$/gi, 'Contact'],
  [/^Nous écrivons de vraies réponses\.$/g, 'De vraies réponses, écrites à la main.'],
  // « nous » dans quelques formules courantes
  [/[ÉE]crivez-nous à/g, 'Écrivez à'],
  [/[ÉE]crivez-nous avant/g, 'Écrivez à contact@atelierjlt.fr avant'],
  [/contactez-nous/g, 'contactez l’atelier'],
  [/Contactez-nous/g, 'Contactez l’atelier'],
  [/Merci de nous écrire/g, 'Merci d’écrire à contact@atelierjlt.fr'],
  [/Suivez-nous/g, 'Suivez l’atelier'],
]

export function cleanBrandText(str) {
  if (typeof str !== 'string' || !str) return str
  let s = str
  for (const [re, rep] of RULES) s = s.replace(re, rep)
  return s.replace(/[ \t]{2,}/g, ' ').replace(/^\s*[—–-]\s*/, '').replace(/\n{3,}/g, '\n\n').trim()
}

/** Applique cleanBrandText à toutes les chaînes d'un objet (copie). */
export function cleanBrandDeep(value) {
  if (typeof value === 'string') return cleanBrandText(value)
  if (Array.isArray(value)) return value.map(cleanBrandDeep)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      // Les liens, identifiants et images ne sont jamais modifiés
      out[k] = /^(href|url|src|image|images|slug|id|_id|key|email|instagram|facebook|ctaHref|viewAllHref)$/i.test(k) ? v : cleanBrandDeep(v)
    }
    return out
  }
  return value
}
