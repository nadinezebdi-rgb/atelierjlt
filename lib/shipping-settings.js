// Modes de livraison et tarifs. Le point relais (Mondial Relay) s'active / se
// désactive et se tarife dans l'admin (Commandes → Livraison).
import { getDb } from '@/lib/db'

export const STANDARD_PRICE = 8.9
export const EXPRESS_PRICE = 14.9
export const RELAY_DEFAULTS = { relayEnabled: true, relayPrice: 4.9, mrBrand: 'BDTEST  ' }

export function sanitizeBrand(b) {
  const s = String(b ?? '').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 8)
  return s.trim() ? s.padEnd(8, ' ') : RELAY_DEFAULTS.mrBrand
}

export async function getShippingSettings() {
  let doc = null
  try {
    const db = await getDb()
    doc = await db.collection('site_settings').findOne({ _id: 'shipping' })
  } catch {}
  const price = Number(doc?.relayPrice)
  return {
    standardPrice: STANDARD_PRICE,
    expressPrice: EXPRESS_PRICE,
    relayEnabled: typeof doc?.relayEnabled === 'boolean' ? doc.relayEnabled : RELAY_DEFAULTS.relayEnabled,
    relayPrice: Number.isFinite(price) && price >= 0 ? Math.round(price * 100) / 100 : RELAY_DEFAULTS.relayPrice,
    mrBrand: doc?.mrBrand ? sanitizeBrand(doc.mrBrand) : RELAY_DEFAULTS.mrBrand,
  }
}

/** Prix de livraison côté serveur (jamais celui envoyé par le navigateur). */
export function shippingCost(method, s) {
  if (method === 'express') return s.expressPrice
  if (method === 'relay' && s.relayEnabled) return s.relayPrice
  return s.standardPrice
}

/** Valide le relais choisi dans la carte Mondial Relay. */
export function cleanRelay(r) {
  if (!r || typeof r !== 'object') return null
  const str = (v, n = 120) => String(v ?? '').trim().slice(0, n)
  const relay = { id: str(r.id, 20), name: str(r.name), address: str(r.address), zip: str(r.zip, 10), city: str(r.city, 80), country: str(r.country, 2).toUpperCase() || 'FR' }
  if (!relay.id || !relay.name || !relay.address || !/^\d{5}$/.test(relay.zip) || !relay.city || relay.country !== 'FR') return null
  return relay
}
