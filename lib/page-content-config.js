// Contenu éditable des pages secondaires — source UNIQUE partagée entre :
//   - les pages publiques (valeurs par défaut)
//   - le mode édition visuel (?edit=1) → PageEditShell
//   - l'admin (/admin → Éditeur du site → Pages)
import { IMAGES } from '@/lib/data/products'

// Photo « plaid sur canapé » retirée à la demande : plus d'image imposée par défaut.
export const RETIRED_IMAGES = ['jlt-hero-beige', 'jlt-plaid-beige']
export function cleanImage(url) {
  const u = String(url || '')
  return RETIRED_IMAGES.some((r) => u.includes(r)) ? '' : u
}
const DEFAULT_IMAGE = ''

/* ------------------------------ À propos ------------------------------ */
export const ABOUT_DEFAULTS = {
  heroImage: DEFAULT_IMAGE,
  heroImageAlt: 'Atelier JLT — créations faites main',
  heroEyebrow: 'À propos',
  heroTitle: "Atelier JLT,\nc'est quoi ?",
  intro:
    "Atelier\u00a0JLT, c'est une aventure artisanale née de mon amour pour la création et la décoration d'intérieur. J'imagine et confectionne à la main des pièces pensées pour apporter de la douceur, de la chaleur et du caractère à votre maison. Chaque création prend forme avec soin, amour et patience, au rythme des gestes et du travail de la matière.",
  paragraph2:
    "Basé en France, Atelier\u00a0JLT possède aussi une âme nomade. Mes créations m'accompagnent dans les différents endroits où je voyage\u00a0: un ouvrage commencé ici peut ainsi se poursuivre ailleurs, au fil de mes déplacements et de mes découvertes.",
  quote:
    "« Les paysages, les couleurs, les matières et les rencontres nourrissent mon imagination. »",
  paragraph3:
    "Mes voyages passés comme ceux en cours se retrouvent, par petites touches, dans les associations de teintes, les textures et les formes que je choisis.",
  paragraph4:
    "À travers Atelier\u00a0JLT, je souhaite partager le plaisir des objets faits main, ceux auxquels on s'attache et qui trouvent naturellement leur place dans notre quotidien. De légères irrégularités peuvent témoigner du geste artisanal\u00a0: elles font partie de l'histoire et du caractère de chaque pièce.",
  signature:
    "Derrière chaque création, il y a mes mains, du temps, une idée qui a mûri… et parfois un petit bout de voyage à accueillir chez vous.",
  ctaEyebrow: 'Découvrir',
  ctaTitle: 'Les créations de la maison.',
  ctaDescription:
    'Chaque pièce est unique, imaginée et confectionnée à la main — plaids, coussins, paniers, macramés…',
  ctaButton1Label: 'Voir les collections',
  ctaButton1Href: '/collections',
  ctaButton2Label: 'Contact',
  ctaButton2Href: '/contact',
}

export const ABOUT_FIELDS = [
  { key: 'heroImage', type: 'image', label: 'Image du hero' },
  { key: 'heroImageAlt', type: 'text', label: 'Texte alternatif (SEO)' },
  { key: 'heroEyebrow', type: 'text', label: 'Petit texte (sur-titre)' },
  { key: 'heroTitle', type: 'textarea', label: 'Grand titre (saut de ligne autorisé)' },
  { key: 'intro', type: 'longtext', label: 'Paragraphe d\u2019introduction' },
  { key: 'paragraph2', type: 'longtext', label: 'Paragraphe 2' },
  { key: 'quote', type: 'textarea', label: 'Citation' },
  { key: 'paragraph3', type: 'longtext', label: 'Paragraphe 3' },
  { key: 'paragraph4', type: 'longtext', label: 'Paragraphe 4' },
  { key: 'signature', type: 'longtext', label: 'Signature finale' },
  { key: 'ctaEyebrow', type: 'text', label: 'CTA — Petit texte' },
  { key: 'ctaTitle', type: 'textarea', label: 'CTA — Grand titre' },
  { key: 'ctaDescription', type: 'textarea', label: 'CTA — Description' },
  { key: 'ctaButton1Label', type: 'text', label: 'Bouton 1 — texte' },
  { key: 'ctaButton1Href', type: 'text', label: 'Bouton 1 — lien' },
  { key: 'ctaButton2Label', type: 'text', label: 'Bouton 2 — texte' },
  { key: 'ctaButton2Href', type: 'text', label: 'Bouton 2 — lien' },
]

/* ------------------------------- Contact ------------------------------- */
export const CONTACT_DEFAULTS = {
  eyebrow: 'Contact',
  title: 'De vraies réponses, écrites à la main.',
  description: "Une question, un projet, une commande spéciale ? Notre atelier est joignable du lundi au vendredi.",
  formNameLabel: 'Votre nom',
  formEmailLabel: 'Votre email',
  formMessageLabel: 'Votre message',
  formButtonLabel: 'Envoyer le message',
  formButtonSending: 'Envoi…',
  successMessage: 'Message envoyé. Nous revenons vers vous rapidement.',
  errorMessage: 'Champs invalides.',
  infoEmailTitle: 'Bonjour',
  infoEmailValue: 'contact@atelierjlt.fr',
  socialTitle: 'Réseaux sociaux',
  instagramUrl: 'https://instagram.com/atelierjlt',
  facebookUrl: 'https://facebook.com/atelierjlt',
  showInstagram: true,
  showFacebook: true,
}

export const CONTACT_FIELDS = [
  { key: 'eyebrow', type: 'text', label: 'Petit texte (sur-titre)' },
  { key: 'title', type: 'textarea', label: 'Grand titre' },
  { key: 'description', type: 'textarea', label: 'Description sous le titre' },

  { key: 'formNameLabel', type: 'text', label: 'Formulaire — label "Nom"' },
  { key: 'formEmailLabel', type: 'text', label: 'Formulaire — label "Email"' },
  { key: 'formMessageLabel', type: 'text', label: 'Formulaire — label "Message"' },
  { key: 'formButtonLabel', type: 'text', label: 'Texte du bouton d\u2019envoi' },
  { key: 'formButtonSending', type: 'text', label: 'Texte pendant l\u2019envoi' },
  { key: 'successMessage', type: 'text', label: 'Message de succès' },
  { key: 'errorMessage', type: 'text', label: 'Message d\u2019erreur' },

  { key: 'infoEmailTitle', type: 'text', label: 'Bloc email — titre' },
  { key: 'infoEmailValue', type: 'text', label: 'Bloc email — adresse' },

  { key: 'socialTitle', type: 'text', label: 'Réseaux — titre' },
  { key: 'instagramUrl', type: 'text', label: 'Instagram — lien' },
  { key: 'facebookUrl', type: 'text', label: 'Facebook — lien' },
]

/* -------------------- Collection Printemps / Été ---------------------- */
export const PE_DEFAULTS = {
  heroImage:
    'https://images.unsplash.com/photo-1509319159802-d05082d619e9?crop=entropy&cs=srgb&fm=jpg&w=1600',
  heroEyebrow: 'Nouvelle saison',
  heroTitle: 'Printemps / Été 2026-2027',
  heroSubtitle:
    'Doux · Chaleureux · Bien chez soi.',
  moodImage:
    'https://images.unsplash.com/photo-1777542842007-7451f84ef59b?crop=entropy&cs=srgb&fm=jpg&w=1200',
  moodEyebrow: 'Ambiance',
  moodTitle: "Le soleil retrouve\nla maison.",
  moodText:
    "Pastels tendres et quelques touches flash — comme un bouquet cueilli au matin. Fils fins, cordons tressés, trapilho et rafia : les matières s'éclaircissent, les textures se font aériennes. On met des fleurs partout, on laisse la lumière entrer.",
  paletteEyebrow: 'La palette',
  paletteTitle: 'Cinq couleurs,\nune saison.',
  materialsEyebrow: 'Les matières',
  materialsTitle: 'Fils fins et cordons tressés.',
  palette: [
    { name: 'Rose poudré',     hex: '#C98498' },
    { name: 'Orange paprika',  hex: '#D97A3A' },
    { name: 'Bleu ciel',       hex: '#7FA0B5' },
    { name: 'Beige crème',     hex: '#E8DDC6' },
    { name: 'Vert sauge',      hex: '#9BAE86' },
  ],
  materials: [
    {
      name: 'Cordons tresse',
      image:
        'https://images.unsplash.com/photo-1622532470022-24107cac5ef3?crop=entropy&cs=srgb&fm=jpg&w=900',
    },
    {
      name: 'Trapilho',
      image:
        'https://images.unsplash.com/photo-1524404794194-16bae22718c0?crop=entropy&cs=srgb&fm=jpg&w=900',
    },
    {
      name: 'Laine de coton',
      image: '/api/img/jlt-couv-fluffy',
    },
    {
      name: 'Rafia',
      image:
        'https://images.unsplash.com/photo-1604014056465-9e90a41e111c?crop=entropy&cs=srgb&fm=jpg&w=900',
    },
  ],
}

export const PE_FIELDS = [
  { key: 'heroImage', type: 'image', label: 'Image du hero' },
  { key: 'heroEyebrow', type: 'text', label: 'Hero — petit texte' },
  { key: 'heroTitle', type: 'textarea', label: 'Hero — grand titre' },
  { key: 'heroSubtitle', type: 'textarea', label: 'Hero — sous-titre' },
  { key: 'moodImage', type: 'image', label: 'Ambiance — image' },
  { key: 'moodEyebrow', type: 'text', label: 'Ambiance — petit texte' },
  { key: 'moodTitle', type: 'textarea', label: 'Ambiance — grand titre' },
  { key: 'moodText', type: 'longtext', label: 'Ambiance — paragraphe' },
  { key: 'paletteEyebrow', type: 'text', label: 'Palette — petit texte' },
  { key: 'paletteTitle', type: 'textarea', label: 'Palette — grand titre (saut de ligne autorisé)' },
  { key: 'palette', type: 'palette', label: 'Palette de couleurs' },
  { key: 'materialsEyebrow', type: 'text', label: 'Matières — petit texte' },
  { key: 'materialsTitle', type: 'textarea', label: 'Matières — grand titre (saut de ligne autorisé)' },
  { key: 'materials', type: 'materials', label: 'Matières' },
]

/** Fusion contenu enregistré + valeurs par défaut (palette/matières : liste vide = défaut). */
export function mergePageContent(key, saved) {
  const cfg = PAGE_CONFIGS[key]
  const s = saved || {}
  if (!cfg) return s
  const merged = { ...cfg.defaults, ...s }
  if (key === 'collectionPE2027') {
    merged.palette = Array.isArray(s.palette) && s.palette.length > 0 ? s.palette : cfg.defaults.palette
    merged.materials = Array.isArray(s.materials) && s.materials.length > 0 ? s.materials : cfg.defaults.materials
  }
  return merged
}

export const PAGE_CONFIGS = {
  about: { key: 'about', label: 'Page « À propos »', href: '/a-propos', defaults: ABOUT_DEFAULTS, fields: ABOUT_FIELDS },
  contact: { key: 'contact', label: 'Page « Contact »', href: '/contact', defaults: CONTACT_DEFAULTS, fields: CONTACT_FIELDS },
  collectionPE2027: { key: 'collectionPE2027', label: 'Collection « Printemps / Été 2026-2027 »', href: '/collection/printemps-ete-2026-2027', defaults: PE_DEFAULTS, fields: PE_FIELDS },
}
