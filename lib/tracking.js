// Transporteurs & liens de suivi — partagé admin / espace client / emails.

export const CARRIERS = [
  { v: 'colissimo', label: 'Colissimo / La Poste' },
  { v: 'mondialrelay', label: 'Mondial Relay' },
  { v: 'chronopost', label: 'Chronopost' },
  { v: 'dpd', label: 'DPD' },
  { v: 'ups', label: 'UPS' },
  { v: 'other', label: 'Autre (lien personnalisé)' },
]

export function carrierLabel(v) {
  return CARRIERS.find((c) => c.v === v)?.label || 'Transporteur'
}

/** Lien de suivi public pour un transporteur + numéro (ou lien personnalisé). */
export function getTrackingUrl(order) {
  const o = order || {}
  if (o.trackingUrl && /^https:\/\//i.test(o.trackingUrl)) return o.trackingUrl
  const n = encodeURIComponent((o.trackingNumber || '').trim())
  if (!n) return ''
  switch (o.carrier || 'colissimo') {
    case 'colissimo':
      return `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`
    case 'mondialrelay':
      return `https://www.mondialrelay.fr/suivi-de-colis/?NumeroExpedition=${n}`
    case 'chronopost':
      return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`
    case 'dpd':
      return `https://trace.dpd.fr/fr/trace/${n}`
    case 'ups':
      return `https://www.ups.com/track?loc=fr_FR&tracknum=${n}`
    default:
      return ''
  }
}

export const ORDER_STEPS = [
  ['received', 'Reçue'],
  ['preparing', 'En préparation'],
  ['shipped', 'Expédiée'],
  ['delivered', 'Livrée'],
]
