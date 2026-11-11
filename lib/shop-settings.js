// Ouverture des ventes. Tant qu'aucun paiement en ligne n'est branché, aucune
// commande ne peut être validée — même si l'interrupteur de l'admin est activé.
import { getDb } from '@/lib/db'

// Passe à true uniquement quand le paiement en ligne (ex. Stripe) sera réellement
// branché au tunnel de commande. Une simple clé dans l'environnement ne suffit pas.
export const PAYMENT_INTEGRATED = false

export function paymentReady() {
  return PAYMENT_INTEGRATED
}

export async function getShopSettings() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_settings').findOne({ _id: 'shop' })
    const wanted = !!doc?.salesOpen
    return { salesOpen: wanted && paymentReady(), salesOpenWanted: wanted, paymentReady: paymentReady(), updatedAt: doc?.updatedAt || null }
  } catch {
    return { salesOpen: false, salesOpenWanted: false, paymentReady: paymentReady(), updatedAt: null }
  }
}

export async function salesOpen() {
  return (await getShopSettings()).salesOpen
}

export const SALES_CLOSED_MESSAGE = 'Les ventes en ligne ouvrent bientôt. Laissez votre e-mail sur la fiche d’une pièce pour être prévenu(e) de l’ouverture.'
