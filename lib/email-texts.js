// Textes modifiables des e-mails (Admin → Commandes → Emails clients).
// Chaque modèle a des champs (objet, introduction, bouton, conclusion…) avec un texte
// d'origine. Les variables entre accolades sont remplacées à l'envoi : {prenom}, {commande}…
import { getDb } from '@/lib/db'

export const EMAIL_TEXTS = {
  welcome: {
    label: 'Bienvenue (nouveau compte)',
    vars: ['prenom', 'code'],
    fields: {
      subject: ['Objet', 'Bienvenue chez Atelier JLT'],
      intro: ['Introduction', "Merci d'avoir créé votre compte Atelier JLT. Chaque pièce est façonnée à la main, en petite série, dans notre atelier."],
      codeTitle: ['Titre du code', 'Votre cadeau de bienvenue'],
      codeText: ['Texte sous le code', '-10 % sur votre première commande, à saisir au paiement'],
      button: ['Bouton', 'Découvrir les collections'],
      outro: ['Conclusion', 'À très bientôt,\nAtelier JLT'],
    },
  },
  order_confirmation: {
    label: 'Confirmation de commande',
    vars: ['prenom', 'commande', 'total'],
    fields: {
      subject: ['Objet', 'Merci pour votre commande {commande}'],
      intro: ['Introduction', 'Merci pour votre commande {commande}. Nous la préparons avec soin dans notre atelier.'],
      note: ['Note sous le récapitulatif', "Vous recevrez un email avec le lien de suivi dès l'expédition de votre colis."],
      button: ['Bouton', 'Suivre ma commande'],
      outro: ['Conclusion', 'À très bientôt,\nAtelier JLT'],
    },
  },
  owner_new_order: {
    label: 'Nouvelle commande (pour vous)',
    vars: ['commande', 'total', 'client'],
    fields: {
      subject: ['Objet', 'Nouvelle commande {commande} — {total}'],
      intro: ['Introduction', 'Nouvelle commande {commande}'],
      button: ['Bouton', "Ouvrir l'admin"],
    },
  },
  order_shipped: {
    label: 'Colis expédié + suivi',
    vars: ['prenom', 'commande', 'transporteur', 'suivi'],
    fields: {
      subject: ['Objet', 'Votre commande {commande} est en route'],
      intro: ['Introduction', "Bonne nouvelle : votre commande {commande} vient d'être expédiée."],
      button: ['Bouton', 'Suivre mon colis'],
      outro: ['Conclusion', 'Merci pour votre confiance,\nAtelier JLT'],
    },
  },
  back_in_stock: {
    label: 'Retour en stock',
    vars: ['produit', 'detail'],
    fields: {
      subject: ['Objet', '{produit} est de retour — Atelier JLT'],
      intro: ['Introduction', 'Bonne nouvelle : {produit} {detail} est de nouveau disponible.'],
      button: ['Bouton', 'Voir la pièce'],
      outro: ['Conclusion', 'Les pièces faites main partent vite — à très bientôt,\nAtelier JLT'],
    },
  },
  cart_reminder_1: {
    label: 'Panier abandonné — 1re relance',
    vars: ['prenom'],
    fields: {
      subject: ['Objet', 'Vos pièces vous attendent — Atelier JLT'],
      intro: ['Introduction', 'Vous avez laissé quelques pièces dans votre panier. Nous les gardons au chaud pour vous.'],
      button: ['Bouton', 'Finaliser ma commande'],
      outro: ['Conclusion', 'À très bientôt,\nAtelier JLT'],
    },
  },
  cart_reminder_2: {
    label: 'Panier abandonné — 2e relance',
    vars: ['prenom'],
    fields: {
      subject: ['Objet', 'Toujours tenté(e) ? Votre panier est encore là'],
      intro: ['Introduction', 'Petit rappel : votre panier est toujours là. Nos pièces sont faites main en petite série, elles ne restent jamais longtemps.'],
      button: ['Bouton', 'Finaliser ma commande'],
      outro: ['Conclusion', 'À très bientôt,\nAtelier JLT'],
    },
  },
  guest_cart_link: {
    label: 'Lien vers le panier (visiteur)',
    vars: [],
    fields: {
      subject: ['Objet', 'Votre panier Atelier JLT'],
      intro: ['Introduction', 'Voici votre panier, mis de côté pour vous. Il vous suffit de cliquer pour le retrouver, sur n’importe quel appareil.'],
      button: ['Bouton', 'Retrouver mon panier'],
      outro: ['Conclusion', 'À très bientôt,\nAtelier JLT'],
    },
  },
  password_reset: {
    label: 'Mot de passe oublié',
    vars: ['prenom'],
    fields: {
      subject: ['Objet', 'Réinitialisation de votre mot de passe — Atelier JLT'],
      intro: ['Introduction', 'Vous avez demandé à réinitialiser votre mot de passe. Cliquez ci-dessous pour en choisir un nouveau — ce lien est valable 1 heure.'],
      button: ['Bouton', 'Choisir un nouveau mot de passe'],
      outro: ['Note de sécurité', "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email : votre mot de passe actuel reste inchangé."],
    },
  },
}

export const VAR_LABELS = {
  prenom: 'prénom du client', commande: 'n° de commande', total: 'montant total', client: 'nom du client',
  code: 'code de bienvenue', produit: 'nom de la pièce', detail: 'couleur / taille', transporteur: 'transporteur', suivi: 'n° de suivi',
}

export const MAX_LEN = { subject: 200, default: 1500 }

export function defaultTexts(kind) {
  const def = EMAIL_TEXTS[kind]
  if (!def) return {}
  return Object.fromEntries(Object.entries(def.fields).map(([k, [, v]]) => [k, v]))
}

/** Ne garde que les champs connus, coupés à la bonne longueur. Champs vides = texte d'origine. */
export function sanitizeTexts(kind, values = {}) {
  const def = EMAIL_TEXTS[kind]
  if (!def) return null
  const out = {}
  for (const k of Object.keys(def.fields)) {
    const v = typeof values[k] === 'string' ? values[k].replace(/\r\n/g, '\n').trim() : ''
    if (v) out[k] = v.slice(0, MAX_LEN[k] || MAX_LEN.default)
  }
  return out
}

/** Textes de l'admin fusionnés avec le texte d'origine. `draft` sert à l'aperçu en direct. */
export async function getEmailTexts(kind, draft = null) {
  const base = defaultTexts(kind)
  let custom = {}
  if (draft) custom = sanitizeTexts(kind, draft) || {}
  else {
    try {
      const db = await getDb()
      const doc = await db.collection('email_templates').findOne({ _id: kind })
      custom = sanitizeTexts(kind, doc?.values || {}) || {}
    } catch {}
  }
  return { ...base, ...custom }
}

/** Remplace {variable} par sa valeur ; nettoie les doubles espaces laissés par une variable vide. */
export function fill(str, vars = {}) {
  return String(str || '')
    .replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k] ?? '') : m))
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ ([,.])/g, '$1')
    .trim()
}
