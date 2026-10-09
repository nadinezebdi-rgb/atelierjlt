// Sections modulaires de la page d'accueil — édition, activation
// et masquage depuis l'admin (onglet Contenu du site → Sections page d'accueil).

// Sections modulaires de la page d'accueil — édition, activation
// et masquage depuis l'admin (onglet Contenu du site → Sections page d'accueil).

// ID stables. `type` détermine le composant qui rend la section côté page.
// Les valeurs éditables sont dans `content`.

/* =====================================================================
   Bibliothèque de modèles — proposés quand on ajoute une bannière custom
   ===================================================================== */
export const BANNER_TEMPLATES = [
  {
    key: 'promo',
    name: 'Promotion',
    tagline: 'Offre limitée, code promo, soldes',
    accent: 'terracotta',
    preset: {
      eyebrow: 'Offre limitée · -15%',
      title: 'Les jours doux commencent.',
      ctaLabel: 'Profiter de l’offre',
      ctaHref: '/collections?cat=nouveautes',
      image: '/api/img/jlt-plaid-01',
      align: 'left',
      overlay: 'dark',
      height: 'md',
    },
  },
  {
    key: 'storytelling',
    name: 'Storytelling',
    tagline: 'Récit de l’atelier, coulisses, savoir-faire',
    accent: 'emerald',
    preset: {
      eyebrow: 'Dans l’atelier',
      title: 'Le geste qui prend le temps.',
      ctaLabel: 'Lire l’histoire',
      ctaHref: '/journal',
      image: '/api/img/jlt-hero-deco',
      align: 'right',
      overlay: 'dark',
      height: 'md',
    },
  },
  {
    key: 'featured',
    name: 'Produit vedette',
    tagline: 'Mettre en avant une pièce signature',
    accent: 'sable',
    preset: {
      eyebrow: 'Les Classiques Atelier JLT',
      title: 'Le Plaid Sylvestre.',
      ctaLabel: 'Voir la pièce',
      ctaHref: '/produit/plaid-sylvestre',
      image: '/api/img/jlt-plaid-01',
      align: 'left',
      overlay: 'dark',
      height: 'lg',
    },
  },
  {
    key: 'collection',
    name: 'Collection',
    tagline: 'Découvrir une collection ou univers',
    accent: 'brique',
    preset: {
      eyebrow: 'Nouvelle collection',
      title: 'Empreinte, les traces qui habillent les murs.',
      ctaLabel: 'Découvrir la collection',
      ctaHref: '/collections?cat=empreinte',
      image: 'https://images.pexels.com/photos/6208095/pexels-photo-6208095.jpeg?auto=compress&cs=tinysrgb&w=1400',
      align: 'right',
      overlay: 'dark',
      height: 'lg',
    },
  },
  {
    key: 'blank',
    name: 'Vierge',
    tagline: 'Repartir d’une page blanche',
    accent: 'ink',
    preset: {
      eyebrow: 'Nouveau',
      title: 'Votre titre ici',
      ctaLabel: 'Découvrir',
      ctaHref: '/collections',
      image: '',
      align: 'left',
      overlay: 'dark',
      height: 'md',
    },
  },
]

export const HOMEPAGE_SECTION_DEFAULTS = [
  {
    // 1. Les Intemporels — basiques toute l'année, juste sous le hero
    id: 'carousel-intemporels',
    type: 'product-carousel',
    label: 'Carrousel — Les Intemporels',
    enabled: true,
    content: {
      eyebrow: 'La signature permanente',
      title: 'Nos Intemporels.',
      description: "À l'Atelier JLT, nous avons à cœur de cultiver nos racines. Nos créations intemporelles sont le socle de notre savoir-faire, pensées pour traverser le temps et habiller votre intérieur avec authenticité. Si chaque nouvelle saison nous inspire des collections inédites, ces grands classiques restent nos essentiels, la signature permanente de l'atelier.",
      viewAllHref: '/collections?cat=intemporels',
      filter: 'classiques',
      limit: 10,
      hideBadges: true,
    },
  },
  {
    // 2. Collection saisonnière — grande bannière florale qui mène à la page dédiée
    id: 'editorial-pe-2027',
    type: 'editorial-banner',
    label: 'Bannière éditoriale — Collection Printemps/Été 2026-2027',
    enabled: true,
    content: {
      eyebrow: 'Nouvelle saison',
      title: 'Printemps / Été 2026-2027.',
      ctaLabel: 'Découvrir la collection',
      ctaHref: '/collection/printemps-ete-2026-2027',
      image: 'https://images.unsplash.com/photo-1509319159802-d05082d619e9?crop=entropy&cs=srgb&fm=jpg&w=1600',
      align: 'left',
      overlay: 'dark',
      height: 'lg',
    },
  },
  {
    // 3. Newsletter — toujours en bas
    id: 'newsletter',
    type: 'newsletter',
    label: 'Bloc newsletter',
    enabled: true,
    content: {},
  },
]

// Fusionne les sections stockées en DB avec les défauts pour garantir
// que la structure et les nouvelles sections ajoutées côté code
// apparaissent toujours, sans écraser les personnalisations client.
// Les sections marquées `custom: true` (créées depuis l'admin) sont
// toujours conservées, même si elles ne figurent pas dans les défauts.
export function mergeHomepageSections(dbSections) {
  // Normalise les sections saved en DB : on indexe par id
  const savedMap = new Map(
    (Array.isArray(dbSections) ? dbSections : []).map((s) => [s.id, s])
  )

  // On part TOUJOURS de l'ordre des défauts actuels — ça garantit que l'ordre
  // visuel reste prévisible même si la DB contient des IDs anciens qui ne font
  // plus partie du site (ex : category-tiles, carousel-new, collections-themes…).
  // Pour chaque défaut, on surcharge le contenu avec ce qui est en DB.
  const base = HOMEPAGE_SECTION_DEFAULTS.map((def) => {
    const saved = savedMap.get(def.id)
    if (!saved) return { ...def, content: { ...def.content } }
    return {
      ...def,
      ...saved,
      content: { ...def.content, ...(saved.content || {}) },
    }
  })

  // Sections 100% personnalisées (créées depuis l'admin, type = custom) :
  // on les conserve à la position où elles ont été ajoutées.
  const custom = (Array.isArray(dbSections) ? dbSections : [])
    .filter((s) => s.custom && !HOMEPAGE_SECTION_DEFAULTS.some((d) => d.id === s.id))
    .map((s) => ({
      type: 'editorial-banner',
      label: s.label || 'Bannière personnalisée',
      enabled: s.enabled !== false,
      ...s,
      content: s.content || {},
    }))

  return [...base, ...custom]
}
