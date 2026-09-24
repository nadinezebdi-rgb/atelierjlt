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
      title: 'Terre, matière du foyer.',
      ctaLabel: 'Découvrir la collection',
      ctaHref: '/collections?cat=terre',
      image: '/api/img/jlt-terra',
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
    id: 'category-tiles',
    type: 'category-tiles',
    label: '3 collections — grille verticale',
    enabled: true,
    content: {},
  },
  {
    id: 'editorial-poterie',
    type: 'editorial-banner',
    label: 'Bannière éditoriale — Poterie tournée main',
    // Désactivée par défaut, conformément à la demande.
    enabled: false,
    content: {
      eyebrow: 'Nouveau · Automne-Hiver 2025',
      title: 'Poterie tournée main.',
      ctaLabel: 'Découvrir Terre',
      ctaHref: '/collections?cat=terre',
      image: '/api/img/jlt-terra',
      align: 'left',
      overlay: 'dark',
      height: 'lg',
    },
  },
  {
    id: 'carousel-new',
    type: 'product-carousel',
    label: 'Carrousel — Nouveautés',
    enabled: true,
    content: {
      eyebrow: 'Les dernières créations',
      title: 'Nouveautés.',
      viewAllHref: '/collections?cat=nouveautes',
      filter: 'new',
      limit: 8,
    },
  },
  {
    id: 'editorial-plaid-genese',
    type: 'editorial-banner',
    label: 'Bannière éditoriale — Genèse d’un plaid',
    enabled: true,
    content: {
      eyebrow: 'Dans l’atelier',
      title: 'La genèse d’un plaid, maille après maille.',
      ctaLabel: 'Lire l’histoire',
      ctaHref: '/journal',
      image: '/api/img/jlt-plaid-02',
      align: 'right',
      overlay: 'dark',
      height: 'md',
    },
  },
  {
    id: 'carousel-bestsellers',
    type: 'product-carousel',
    label: 'Carrousel — Meilleures ventes',
    enabled: true,
    content: {
      eyebrow: 'Les intemporelles',
      title: 'Nos meilleures ventes.',
      viewAllHref: '/collections',
      filter: 'bestsellers',
      limit: 8,
    },
  },
  {
    id: 'editorial-sylvestre',
    type: 'editorial-banner',
    label: 'Bannière éditoriale — Plaid Sylvestre',
    enabled: true,
    content: {
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
    id: 'collections-themes',
    type: 'collections-themes',
    label: 'Les 3 collections en détail (Racine · Empreinte · Terre)',
    enabled: true,
    content: {},
  },
  {
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
  if (!Array.isArray(dbSections) || dbSections.length === 0) {
    return HOMEPAGE_SECTION_DEFAULTS.map((s) => ({ ...s, content: { ...s.content } }))
  }
  const orderedFromDb = dbSections
    .map((s) => {
      const def = HOMEPAGE_SECTION_DEFAULTS.find((d) => d.id === s.id)
      if (def) {
        return {
          ...def,
          ...s,
          content: { ...def.content, ...(s.content || {}) },
        }
      }
      // Section personnalisée — on la conserve si elle est marquée custom
      if (s.custom) {
        return {
          type: 'editorial-banner',
          label: s.label || 'Bannière personnalisée',
          enabled: s.enabled !== false,
          ...s,
          content: s.content || {},
        }
      }
      return null // section inconnue et non custom → on l'ignore
    })
    .filter(Boolean)
  const seen = new Set(orderedFromDb.map((s) => s.id))
  const missing = HOMEPAGE_SECTION_DEFAULTS.filter((d) => !seen.has(d.id))
  return [...orderedFromDb, ...missing.map((s) => ({ ...s, content: { ...s.content } }))]
}
