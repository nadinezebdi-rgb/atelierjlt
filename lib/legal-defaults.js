// Pages d'information client (footer) — contenu par défaut, modifiable dans
// /admin → Footer & pages légales. Les mentions entre [crochets] sont à compléter.

export const LEGAL_PAGES = {
  cgv: {
    slug: 'cgv',
    path: '/cgv',
    menuLabel: 'CGV',
    title: 'Conditions générales de vente',
    intro: "Les présentes conditions régissent les ventes réalisées sur la boutique en ligne Atelier JLT. Toute commande implique leur acceptation sans réserve.",
    sections: [
      { title: '1. Vendeur', text: "Atelier JLT — [forme juridique, n° SIRET à compléter].\nContact : contact@atelierjlt.fr" },
      { title: '2. Produits', text: "Nos pièces sont fabriquées à la main : de légères variations de couleur, de dimension ou de texture peuvent exister d'une pièce à l'autre. Elles font le charme de l'artisanat et ne constituent pas un défaut. Les photographies sont aussi fidèles que possible mais n'ont pas de valeur contractuelle." },
      { title: '3. Prix', text: "Les prix sont indiqués en euros, toutes taxes comprises. Les frais de livraison sont précisés avant la validation de la commande. Atelier JLT se réserve le droit de modifier ses prix à tout moment ; le prix applicable est celui affiché au moment de la commande." },
      { title: '4. Commande', text: "La commande est confirmée après validation du paiement. Un récapitulatif est disponible dans votre espace client. Atelier JLT se réserve le droit d'annuler toute commande en cas de litige ou d'indisponibilité d'un article ; le client est alors intégralement remboursé." },
      { title: '5. Paiement', text: "Le paiement s'effectue en ligne par carte bancaire via un prestataire de paiement sécurisé. Aucune donnée bancaire n'est conservée par Atelier JLT." },
      { title: '6. Livraison', text: "Les modalités et délais de livraison sont détaillés sur la page « Livraison & retours »." },
      { title: '7. Droit de rétractation', text: "Conformément à l'article L221-18 du Code de la consommation, vous disposez de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier de motif. Les articles personnalisés ou réalisés sur mesure sont exclus de ce droit (article L221-28)." },
      { title: '8. Garanties', text: "Tous nos produits bénéficient de la garantie légale de conformité (articles L217-3 et suivants du Code de la consommation) et de la garantie contre les vices cachés (articles 1641 et suivants du Code civil)." },
      { title: '9. Litiges et médiation', text: "En cas de litige, contactez-nous d'abord pour trouver une solution amiable. Vous pouvez également recourir gratuitement au médiateur de la consommation : [nom et coordonnées du médiateur à compléter]. Les présentes conditions sont soumises au droit français." },
    ],
  },
  livraison: {
    slug: 'livraison',
    path: '/livraison',
    menuLabel: 'Livraison & retours',
    title: 'Livraison & retours',
    intro: 'Chaque pièce est emballée avec soin à l’atelier avant de partir chez vous.',
    sections: [
      { title: 'Zones de livraison', text: 'Nous livrons en France métropolitaine. [Autres pays à compléter]' },
      { title: 'Délais', text: 'Préparation de la commande : [délai à compléter].\nLivraison après expédition : [délai à compléter].' },
      { title: 'Frais de livraison', text: '- Livraison standard : 8,90 €\n- Livraison express : 14,90 €' },
      { title: 'Suivi de votre colis', text: 'Dès l’expédition, vous recevez un email avec votre numéro de suivi. Vous le retrouvez aussi dans votre espace client et sur la page « Suivi de commande ».' },
      { title: 'Retours', text: 'Vous disposez de 14 jours après réception pour nous retourner un article, dans son état d’origine. Un bordereau de retour est glissé dans chaque colis : cochez l’article, indiquez le motif et joignez-le à votre envoi. Écrivez-nous avant tout renvoi à contact@atelierjlt.fr.' },
      { title: 'Remboursement', text: 'Le remboursement est effectué sous 14 jours après réception et vérification du retour, sur le moyen de paiement utilisé. Les frais de retour sont à la charge du client, sauf article défectueux ou erreur de notre part.' },
    ],
  },
  suivi: {
    slug: 'suivi',
    path: '/suivi',
    menuLabel: 'Suivi de commande',
    title: 'Suivi de commande',
    intro: 'Entrez votre numéro de commande et l’adresse email utilisée lors de l’achat pour connaître l’état de votre commande.',
    sections: [
      { title: 'Une question ?', text: 'Écrivez-nous à contact@atelierjlt.fr en indiquant votre numéro de commande, nous vous répondons rapidement.' },
    ],
  },
  confidentialite: {
    slug: 'confidentialite',
    path: '/confidentialite',
    menuLabel: 'Confidentialité (RGPD)',
    title: 'Politique de confidentialité',
    intro: 'Atelier JLT attache une grande importance à la protection de vos données personnelles, conformément au Règlement général sur la protection des données (RGPD).',
    sections: [
      { title: 'Responsable du traitement', text: 'Atelier JLT — contact@atelierjlt.fr' },
      { title: 'Données collectées', text: '- Identité et coordonnées : nom, prénom, email, téléphone, adresse de livraison\n- Données de commande : articles, montants, historique\n- Données de navigation : cookies nécessaires au fonctionnement du site (panier, connexion)' },
      { title: 'Finalités', text: '- Traiter et livrer vos commandes\n- Gérer votre compte client et le service après-vente\n- Vous envoyer la newsletter si vous y êtes inscrit(e)\n- Respecter nos obligations légales et comptables' },
      { title: 'Durée de conservation', text: 'Les données clients sont conservées 3 ans après le dernier achat. Les pièces comptables sont conservées 10 ans, conformément à la loi.' },
      { title: 'Destinataires', text: 'Vos données sont destinées uniquement à Atelier JLT et à ses prestataires techniques (paiement, transport, hébergement, envoi d’emails), dans la limite nécessaire à leur mission. Elles ne sont jamais revendues.' },
      { title: 'Vos droits', text: 'Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Pour l’exercer, écrivez à contact@atelierjlt.fr. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).' },
      { title: 'Cookies', text: 'Le site utilise uniquement des cookies nécessaires à son fonctionnement (panier, connexion à votre compte). Vous pouvez à tout moment modifier vos choix via le lien « Gérer les cookies » en bas de page. [Compléter si des cookies de mesure d’audience ou publicitaires sont ajoutés.]' },
    ],
  },
  mentions: {
    slug: 'mentions',
    path: '/mentions-legales',
    menuLabel: 'Mentions légales',
    title: 'Mentions légales',
    intro: 'Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), voici les informations relatives à l’éditeur et à l’hébergeur du site.',
    sections: [
      { title: 'Éditeur du site', text: 'Atelier JLT\nForme juridique : [à compléter]\nN° SIRET : [à compléter]\nN° de TVA intracommunautaire : [à compléter, si applicable]\nAdresse : [à compléter]\nEmail : contact@atelierjlt.fr' },
      { title: 'Directrice de la publication', text: '[Nom et prénom à compléter]' },
      { title: 'Hébergeur', text: 'Nom : [à compléter]\nAdresse : [à compléter]\nTéléphone : [à compléter]' },
      { title: 'Propriété intellectuelle', text: 'L’ensemble des contenus du site (textes, photographies, créations, logo) est la propriété exclusive d’Atelier JLT, sauf mention contraire. Toute reproduction, même partielle, est interdite sans autorisation écrite préalable.' },
      { title: 'Données personnelles', text: 'Le traitement de vos données est détaillé dans notre Politique de confidentialité (RGPD), accessible en bas de chaque page.' },
      { title: 'Contact', text: 'Pour toute question : contact@atelierjlt.fr' },
    ],
  },
}

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES)

export const FOOTER_DEFAULTS = {
  tagline: 'Maison française de décoration artisanale.\nImaginé, fabriqué et assemblé à la main dans notre atelier.',
  email: 'contact@atelierjlt.fr',
  instagram: 'https://www.instagram.com/atelier.jlt/',
  facebook: 'https://www.facebook.com/atelier.jlt/',
  copyright: 'Atelier JLT — Made in France',
  bottomNote: 'Paiement sécurisé',
  cookieText: 'Nous utilisons des cookies nécessaires au fonctionnement du site (panier, connexion). Avec votre accord, nous pourrions aussi mesurer l’audience pour améliorer votre visite.',
  clientLinks: {
    cgv: { label: 'CGV', show: true },
    livraison: { label: 'Livraison & retours', show: true },
    suivi: { label: 'Suivi de commande', show: true },
    confidentialite: { label: 'Confidentialité (RGPD)', show: true },
    mentions: { label: 'Mentions légales', show: true },
  },
}

export function mergeLegalPage(slug, saved) {
  const d = LEGAL_PAGES[slug]
  if (!d) return null
  const s = saved || {}
  return {
    ...d,
    title: s.title ?? d.title,
    intro: s.intro ?? d.intro,
    sections: Array.isArray(s.sections) ? s.sections : d.sections,
    updatedAt: s.updatedAt || null,
  }
}

export function mergeFooter(saved) {
  const s = saved || {}
  const links = {}
  for (const k of LEGAL_SLUGS) links[k] = { ...FOOTER_DEFAULTS.clientLinks[k], ...(s.clientLinks?.[k] || {}) }
  return { ...FOOTER_DEFAULTS, ...s, clientLinks: links }
}
