// Boxtal Connect API v3.1 — étiquettes affranchies multi-transporteurs.
// Variables : BOXTAL_ACCESS_KEY, BOXTAL_SECRET_KEY, BOXTAL_ENV (sandbox|production),
//             BOXTAL_OFFER_CODES (codes d'offres activés sur le compte, séparés par des virgules)
const base = () => (process.env.BOXTAL_ENV === 'production' ? 'https://api.boxtal.com' : 'https://api.boxtal.build')

export function boxtalConfigured() {
  return !!(process.env.BOXTAL_ACCESS_KEY && process.env.BOXTAL_SECRET_KEY)
}

export function boxtalOffers() {
  return (process.env.BOXTAL_OFFER_CODES || '').split(',').map((s) => s.trim()).filter(Boolean)
}

let cached = null
async function token() {
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.accessToken
  const basic = Buffer.from(`${process.env.BOXTAL_ACCESS_KEY}:${process.env.BOXTAL_SECRET_KEY}`).toString('base64')
  const r = await fetch(`${base()}/iam/account-app/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!r.ok) throw Object.assign(new Error('Identifiants Boxtal refusés'), { status: r.status })
  const d = await r.json()
  cached = { accessToken: d.accessToken, expiresAt: Date.now() + Number(d.expiresIn || 600) * 1000 }
  return cached.accessToken
}

async function call(path, options = {}) {
  const t = await token()
  const r = await fetch(`${base()}${path}`, {
    ...options,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${t}`, ...(options.headers || {}) },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  })
  const text = await r.text()
  let body
  try { body = text ? JSON.parse(text) : null } catch { body = text }
  if (!r.ok) throw Object.assign(new Error(`Boxtal ${r.status}`), { status: r.status, body })
  return body
}

const addr = (a, type) => ({
  type,
  contact: { firstName: a.firstName || '', lastName: a.lastName || a.name || '', company: a.company || undefined, email: a.email || undefined, phone: a.phone || undefined },
  location: { street: a.street || '', city: a.city || '', postalCode: a.zip || '', countryIsoCode: a.countryIsoCode || 'FR' },
})

/** Crée l'expédition Boxtal et tente de récupérer étiquette + suivi. */
export async function createBoxtalShipment({ order, sender, parcel, offerCode }) {
  const a = order.address || {}
  const body = {
    labelType: 'PDF_10x15',
    shippingOfferCode: offerCode,
    shipment: {
      externalId: order.orderNumber,
      packages: [{
        type: 'PARCEL',
        weight: Number(parcel.weight),
        width: Number(parcel.width),
        length: Number(parcel.length),
        height: Number(parcel.height),
        value: { value: Number(order.subtotal || order.total || 0), currency: 'EUR' },
      }],
      fromAddress: addr({ company: sender.senderName, lastName: sender.senderName, email: sender.senderEmail, phone: sender.senderPhone, street: [sender.senderAddress, sender.senderAddress2].filter(Boolean).join(' '), city: sender.senderCity, zip: sender.senderZip }, 'BUSINESS'),
      toAddress: addr({ firstName: a.firstName, lastName: a.lastName || a.name, email: a.email, phone: a.phone, street: [a.address, a.apt].filter(Boolean).join(' '), city: a.city, zip: a.zip }, 'RESIDENTIAL'),
    },
  }
  const created = await call('/shipping/v3.1/shipping-order', { method: 'POST', body: JSON.stringify(body) })
  const shipOrder = created?.content || created
  const id = shipOrder?.id
  if (!id) throw new Error('Réponse Boxtal sans identifiant')

  // Les documents peuvent arriver avec un léger délai : quelques essais bornés
  let labelUrl = ''
  let trackingNumber = ''
  let trackingUrl = ''
  for (let i = 0; i < 4 && !labelUrl; i++) {
    if (i) await new Promise((r) => setTimeout(r, 2500))
    try {
      const docs = await call(`/shipping/v3.1/shipping-order/${encodeURIComponent(id)}/shipping-document`)
      const list = docs?.content || docs || []
      const doc = (Array.isArray(list) ? list : []).find((d) => /label|etiquette/i.test(d.type || '')) || (Array.isArray(list) ? list[0] : null)
      labelUrl = doc?.url || doc?.link || ''
    } catch {}
  }
  try {
    const tr = await call(`/shipping/v3.1/shipping-order/${encodeURIComponent(id)}/tracking`)
    const t = Array.isArray(tr?.content) ? tr.content[0] : (tr?.content || tr)
    trackingNumber = t?.trackingNumber || t?.parcelNumber || ''
    trackingUrl = t?.packageTrackingUrl || t?.trackingUrl || ''
  } catch {}
  return { provider: 'boxtal', shipmentId: id, offerCode, labelUrl, trackingNumber, trackingUrl }
}
