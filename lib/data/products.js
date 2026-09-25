// Catalogue Atelier JLT — photos artisanales réelles fournies par la maison.
// Prix en EUR. Slugs stables. Le catalogue est structuré en 3 collections.

export const CATEGORIES = [
  { slug: 'racine',    name: 'Racine',    fullName: 'Collection Racine',    tagline: 'Plaids, coussins, paniers, chemins de table — les tissages du foyer.',  color: 'emerald' },
  { slug: 'empreinte', name: 'Empreinte', fullName: 'Collection Empreinte', tagline: 'Tapis, macramé mural, suspensions — les traces qui habillent les murs.', color: 'sable' },
  { slug: 'terre',     name: 'Terre',     fullName: 'Collection Terre',     tagline: 'Poterie, céramique tournée main, art de la table.',                     color: 'brique' },
  { slug: 'nouveautes',        name: 'Nouveautés',        tagline: 'Les dernières créations', color: 'plantes' },
  { slug: 'editions-limitees', name: 'Éditions limitées', tagline: 'Numérotées, jamais reproduites', color: 'wood' },
]

// Compat : les "collections" narratives (utilisées sur les fiches produit)
export const COLLECTIONS = [
  { slug: 'racine',    name: 'Collection Racine',    story: "Les tissages du foyer — plaids, coussins et paniers noués à la main pour envelopper et adoucir." },
  { slug: 'empreinte', name: 'Collection Empreinte', story: "Les traces qui habillent les murs — tapis, macramés et suspensions comme des signatures textiles." },
  { slug: 'terre',     name: 'Collection Terre',     story: "La poterie tournée à la main — chaque pièce garde la mémoire du geste." },
]

// Real product photos from client zip - served via /api/img (bundled into standalone build)
const P = (name) => `/api/img/${name.replace(/\.(jpe?g|webp|png)$/i, '')}`

// Editorial lifestyle photography (extern) + photos réelles JLT (locales)
export const IMAGES = {
  // Editoriales génériques (à remplacer par les photos JLT à mesure)
  interior1: 'https://images.unsplash.com/photo-1610659856580-323ec67011f9?auto=format&fit=crop&w=1800&q=80',
  interior2: 'https://images.pexels.com/photos/8251400/pexels-photo-8251400.jpeg?auto=compress&cs=tinysrgb&w=1800',
  interior3: 'https://images.unsplash.com/photo-1633505899118-4ca6bd143043?auto=format&fit=crop&w=1800&q=80',
  atelier:   'https://images.pexels.com/photos/38428357/pexels-photo-38428357.jpeg?auto=compress&cs=tinysrgb&w=1800',
  weave:     'https://images.pexels.com/photos/36319631/pexels-photo-36319631.jpeg?auto=compress&cs=tinysrgb&w=1400',

  // Éditoriales pour EMPREINTE (macramé / tapis / suspension) — URLs vérifiées
  macrameHero:  'https://images.pexels.com/photos/13211211/pexels-photo-13211211.jpeg?auto=compress&cs=tinysrgb&w=1800',
  macrameMur:   'https://images.pexels.com/photos/6208095/pexels-photo-6208095.jpeg?auto=compress&cs=tinysrgb&w=1400',
  macrameAtelier: 'https://images.pexels.com/photos/36550601/pexels-photo-36550601.jpeg?auto=compress&cs=tinysrgb&w=1400',
  suspension:   'https://images.pexels.com/photos/12997390/pexels-photo-12997390.jpeg?auto=compress&cs=tinysrgb&w=1400',
  tapisJute:    'https://images.pexels.com/photos/8082537/pexels-photo-8082537.jpeg?auto=compress&cs=tinysrgb&w=1400',
  cheminTable:  'https://images.pexels.com/photos/6812517/pexels-photo-6812517.jpeg?auto=compress&cs=tinysrgb&w=1400',
  panierOsier:  'https://images.pexels.com/photos/6032425/pexels-photo-6032425.jpeg?auto=compress&cs=tinysrgb&w=1400',

  // === Photos réelles Atelier JLT ===
  heroPlaid:     P('jlt-plaid-01'),
  heroDeco:      P('jlt-hero-deco'),
  heroBeige:     P('jlt-hero-beige'),         // ⭐ Hero — canapé crème + plaid beige (paysage 16:9)
  plaidBeige:    P('jlt-plaid-beige'),        // Plaid beige chunky sur canapé crème — RACINE hero
  photMacrame:   P('jlt-photophore-macrame'), // ⭐ Photophore macramé sur porte noire — EMPREINTE hero
  plaid02:       P('jlt-plaid-02'),
  plaid03:       P('jlt-plaid-03'),
  paniersVerts:  P('jlt-paniers-verts'),      // ⭐ 3 paniers crochet vert sauge sur bois blanc — Panier Racine
  couvDecli:     P('jlt-couv-decli'),
  couvFluffy:    P('jlt-couv-fluffy'),
  couvFluffy2:   P('jlt-couv-fluffy2'),
  photophore:    P('jlt-photophore'),
  deco01:        P('jlt-deco-01'),
  deco02:        P('jlt-deco-02'),
  deco03:        P('jlt-deco-03'),
  deco04:        P('jlt-deco-04'),
  deco05:        P('jlt-deco-05'),
  terra:         P('jlt-terra'),
}

/** ------------------------------------------------------------------
 *  CATALOGUE PRODUITS — 3 COLLECTIONS × 5 produits = 15 pièces
 *  ------------------------------------------------------------------
 *  RACINE     — plaid, coussin, panier, chemin de table
 *  EMPREINTE  — tapis, macramé mural, suspensions
 *  TERRE      — poterie, céramique
 *  ------------------------------------------------------------------ */
export const PRODUCTS = [
  // ============ COLLECTION RACINE ============
  {
    id: 'p-01', slug: 'plaid-sylvestre', name: 'Plaid Sylvestre',
    category: 'racine', collection: 'racine', price: 340,
    material: 'Laine mérinos filée main', color: 'Vert sylvestre', style: 'Chunky',
    dimensions: '140 × 180 cm', weight: '2,4 kg', makingTime: '38 heures',
    stock: 4, isNew: true, isLimited: false,
    tags: ['artisanal', 'crochet', 'signature'],
    images: [IMAGES.heroPlaid, IMAGES.plaid02, IMAGES.plaid03],
    variants: [
      { name: 'Vert sylvestre', hex: '#0F5C3F', stock: 4, image: IMAGES.heroPlaid, isDefault: true },
      { name: 'Gris pierre',    hex: '#8B8681', stock: 3, image: IMAGES.plaid02 },
      { name: 'Bordeaux',       hex: '#5B1E1A', stock: 2, image: IMAGES.plaid03 },
      { name: 'Beige lin',      hex: '#D4C7A9', stock: 5, image: IMAGES.couvFluffy },
      { name: 'Ivoire',         hex: '#F1E9DA', stock: 3, image: IMAGES.couvDecli },
    ],
    story: "La signature de la maison. Ce plaid chunky se crochète en trente-huit heures sur métier bas. La laine mérinos filée main garde la mémoire du geste. Chaque pièce est unique — cinq nuances au choix.",
    care: 'Lavage à sec ou à froid, à plat. Étendre à l\u2019abri du soleil direct.',
  },
  {
    id: 'p-02', slug: 'plaid-boreal', name: 'Plaid Boréal',
    category: 'racine', collection: 'racine', price: 320,
    material: 'Laine mérinos filée main', color: 'Écru boréal', style: 'Chunky',
    dimensions: '140 × 180 cm', weight: '2,2 kg', makingTime: '34 heures',
    stock: 5, isNew: true, isLimited: false,
    tags: ['artisanal', 'crochet'],
    images: [IMAGES.couvFluffy, IMAGES.couvFluffy2, IMAGES.couvDecli],
    variants: [
      { name: 'Écru boréal',    hex: '#EFE7D7', stock: 5, image: IMAGES.couvFluffy, isDefault: true },
      { name: 'Sable doux',     hex: '#C9B79A', stock: 4, image: IMAGES.couvFluffy2 },
      { name: 'Camel',          hex: '#9B7B58', stock: 2, image: IMAGES.couvDecli },
      { name: 'Terracotta',     hex: '#B85B45', stock: 3, image: IMAGES.deco01 },
    ],
    story: "Le blanc doux d\u2019un matin d\u2019hiver, décliné en quatre teintes chaleureuses. Ce plaid en laine mérinos enveloppe et adoucit chaque canapé.",
    care: 'Lavage à sec conseillé. Étendre à plat.',
  },
  {
    id: 'p-03', slug: 'coussin-noyau', name: 'Coussin Noyau',
    category: 'racine', collection: 'racine', price: 95,
    material: 'Coton recyclé peigné', color: 'Ivoire', style: 'Structuré',
    dimensions: '45 × 45 cm', weight: '620 g', makingTime: '12 heures',
    stock: 12, isNew: true, isLimited: false,
    tags: ['crochet', 'nouveauté'],
    images: [IMAGES.couvDecli, IMAGES.deco01, IMAGES.plaid02],
    variants: [
      { name: 'Ivoire',         hex: '#F1E9DA', stock: 12, image: IMAGES.couvDecli, isDefault: true },
      { name: 'Vert sauge',     hex: '#8E9C82', stock: 8,  image: IMAGES.paniersVerts },
      { name: 'Rouille',        hex: '#B85B45', stock: 6,  image: IMAGES.deco01 },
      { name: 'Anthracite',     hex: '#3A3937', stock: 4,  image: IMAGES.plaid02 },
    ],
    story: "Un coussin dense, presque tressé, comme la coque d\u2019un noyau. Quatre couleurs pour l\u2019accorder à ton canapé.",
    care: 'Housse déhoussable. Lavage à froid, cycle délicat.',
  },
  {
    id: 'p-04', slug: 'coussin-ecorce', name: 'Coussin Écorce',
    category: 'racine', collection: 'racine', price: 95,
    material: 'Coton recyclé peigné', color: 'Terre brûlée', style: 'Texturé',
    dimensions: '45 × 45 cm', weight: '640 g', makingTime: '14 heures',
    stock: 8, isNew: false, isLimited: false,
    tags: ['crochet'],
    images: [IMAGES.deco03, IMAGES.deco04, IMAGES.deco05],
    story: "Comme l\u2019écorce d\u2019un vieux chêne. Texture irrégulière, tons terre — quatorze heures de crochet main.",
    care: 'Lavage à froid. Étendre à plat.',
  },
  {
    id: 'p-05', slug: 'panier-racine', name: 'Panier Racine',
    category: 'racine', collection: 'racine', price: 95,
    material: 'Coton peigné crochet main', color: 'Vert sauge', style: 'Utilitaire',
    dimensions: 'Ø 28 · 34 · 42 cm (3 tailles)', weight: '820 g', makingTime: '12 à 22 heures',
    stock: 17, isNew: true, isLimited: false,
    tags: ['nouveauté', 'utile', 'crochet'],
    images: [IMAGES.paniersVerts, IMAGES.deco05, IMAGES.deco04],
    variants: [
      { name: 'Vert sauge', hex: '#8E9C82', stock: 8, image: IMAGES.paniersVerts, isDefault: true },
      { name: 'Écru',       hex: '#EFE7D7', stock: 6, image: IMAGES.couvFluffy },
      { name: 'Camel',      hex: '#9B7B58', stock: 3, image: IMAGES.deco05 },
    ],
    sizes: [
      { label: 'Ø Petit',  dimensions: 'Ø 28 × H 26 cm', price: 95,  stock: 8, makingTime: '12 h', isDefault: true },
      { label: 'Ø Moyen',  dimensions: 'Ø 34 × H 32 cm', price: 140, stock: 6, makingTime: '16 h' },
      { label: 'Ø Grand',  dimensions: 'Ø 42 × H 38 cm', price: 185, stock: 3, makingTime: '22 h' },
    ],
    story: "Un trio de paniers crochet main en coton peigné. Chaque taille répond à un usage : le petit pour les petits linges, le moyen pour le plaid, le grand pour le bois. Douze à vingt-deux heures de travail patient au crochet.",
    care: 'Dépoussiérer à sec. Lavable en machine à froid, séchage à plat.',
  },
  {
    id: 'p-06', slug: 'chemin-de-table-mousse', name: 'Chemin de Table Mousse',
    category: 'racine', collection: 'racine', price: 85,
    material: 'Lin lavé & coton peigné', color: 'Vert mousse', style: 'Épuré',
    dimensions: '40 × 180 cm', weight: '340 g', makingTime: '10 heures',
    stock: 10, isNew: false, isLimited: false,
    tags: ['table', 'artisanal'],
    images: [IMAGES.cheminTable, IMAGES.deco02, IMAGES.deco03],
    story: "Le chemin de table qui adoucit une longue table de chêne. Lin lavé, ton vert mousse — dix heures de tissage main.",
    care: 'Lavage à 30°C. Repassage vapeur envers.',
  },

  // ============ COLLECTION EMPREINTE ============
  {
    id: 'p-07', slug: 'tapis-empreinte', name: 'Tapis Empreinte',
    category: 'empreinte', collection: 'empreinte', price: 480,
    material: 'Jute filée main', color: 'Naturel patiné', style: 'Rustique noble',
    dimensions: '160 × 230 cm', weight: '6,8 kg', makingTime: '52 heures',
    stock: 3, isNew: true, isLimited: false,
    tags: ['tapis', 'nouveauté'],
    images: [IMAGES.tapisJute, IMAGES.macrameHero, IMAGES.interior2],
    story: "Un tapis en jute filée main, cinquante-deux heures de tressage. Trace du sol, empreinte du pas — la pièce maîtresse d\u2019une entrée ou d\u2019un salon.",
    care: 'Aspirer régulièrement. Éviter l\u2019humidité prolongée.',
  },
  {
    id: 'p-08', slug: 'tapis-sillon', name: 'Tapis Sillon',
    category: 'empreinte', collection: 'empreinte', price: 380,
    material: 'Laine & coton peigné', color: 'Écru & ocre', style: 'Rainuré',
    dimensions: '120 × 180 cm', weight: '4,2 kg', makingTime: '40 heures',
    stock: 4, isNew: false, isLimited: false,
    tags: ['tapis', 'rainé'],
    images: [IMAGES.interior1, IMAGES.tapisJute, IMAGES.macrameMur],
    story: "Le sillon d\u2019un champ après le passage de la charrue. Ce tapis rainuré, en laine et coton, apporte de la matière sans jamais dominer.",
    care: 'Aspirer. Nettoyage à sec professionnel.',
  },
  {
    id: 'p-09', slug: 'macrame-mural-grand', name: 'Macramé Mural — Grand',
    category: 'empreinte', collection: 'empreinte', price: 265,
    material: 'Corde de coton peignée', color: 'Ivoire naturel', style: 'Contemporain',
    dimensions: '80 × 120 cm', weight: '1,8 kg', makingTime: '32 heures',
    stock: 5, isNew: true, isLimited: false,
    tags: ['mural', 'macramé', 'nouveauté'],
    images: [IMAGES.macrameMur, IMAGES.macrameHero, IMAGES.macrameAtelier],
    story: "Un macramé mural grand format, noué à la main sur trente-deux heures. Corde de coton peignée, dégradé de nœuds — pour une pièce à hauteur d\u2019homme.",
    care: 'Dépoussiérer à sec ou avec une brosse douce.',
  },
  {
    id: 'p-10', slug: 'macrame-mural-petit', name: 'Macramé Mural — Petit',
    category: 'empreinte', collection: 'empreinte', price: 145,
    material: 'Corde de coton peignée', color: 'Ivoire naturel', style: 'Épuré',
    dimensions: '45 × 70 cm', weight: '620 g', makingTime: '16 heures',
    stock: 8, isNew: false, isLimited: false,
    tags: ['mural', 'macramé'],
    images: [IMAGES.macrameHero, IMAGES.macrameMur, IMAGES.deco02],
    story: "Le petit format, parfait pour un couloir, une entrée, un bureau. Seize heures de nœuds patients, corde de coton.",
    care: 'Dépoussiérer à sec.',
  },
  {
    id: 'p-11', slug: 'suspension-cocon', name: 'Suspension Cocon',
    category: 'empreinte', collection: 'empreinte', price: 210,
    material: 'Corde de jute & bois flotté', color: 'Naturel', style: 'Organique',
    dimensions: 'Ø 40 × H 60 cm', weight: '1,1 kg', makingTime: '22 heures',
    stock: 4, isNew: true, isLimited: false,
    tags: ['suspension', 'nouveauté'],
    images: [IMAGES.suspension, IMAGES.macrameHero, IMAGES.interior3],
    story: "Une suspension enveloppante, comme un cocon suspendu. Jute et bois flotté — vingt-deux heures de tressage main. Diffuse une lumière douce et tamisée.",
    care: 'Dépoussiérer à sec. Ampoule LED conseillée.',
  },

  // ============ COLLECTION TERRE ============
  {
    id: 'p-12', slug: 'vase-tourne-grand', name: 'Vase Tourné — Grand',
    category: 'terre', collection: 'terre', price: 195,
    material: 'Grès émaillé', color: 'Sable & rouille', style: 'Tourné main',
    dimensions: 'Ø 22 × H 34 cm', weight: '2,1 kg', makingTime: '8 heures + cuisson',
    stock: 5, isNew: true, isLimited: false,
    tags: ['céramique', 'nouveauté'],
    images: [IMAGES.terra, IMAGES.deco04, IMAGES.deco05],
    story: "Grand vase tourné main. Grès émaillé aux tons sable et rouille — chaque pièce garde la trace du geste. Passage au four à 1240°C.",
    care: 'Étanche. Rinçage à l\u2019eau claire.',
  },
  {
    id: 'p-13', slug: 'bol-racine', name: 'Bol Racine',
    category: 'terre', collection: 'terre', price: 68,
    material: 'Grès émaillé mat', color: 'Terre cuite naturelle', style: 'Rustique',
    dimensions: 'Ø 14 × H 8 cm', weight: '480 g', makingTime: '3 heures + cuisson',
    stock: 15, isNew: false, isLimited: false,
    tags: ['céramique', 'table'],
    images: [IMAGES.terra, IMAGES.deco03, IMAGES.deco04],
    story: "Un bol du quotidien. Grès mat, émail intérieur — pour un café, une soupe, un petit rituel. Passe au lave-vaisselle.",
    care: 'Lave-vaisselle & micro-ondes. Chocs thermiques à éviter.',
  },
  {
    id: 'p-14', slug: 'photophore-terre', name: 'Photophore Terre',
    category: 'terre', collection: 'terre', price: 78,
    material: 'Grès nu tourné main', color: 'Terre cuite', style: 'Sculpté',
    dimensions: 'Ø 12 × H 10 cm', weight: '520 g', makingTime: '4 heures + cuisson',
    stock: 12, isNew: true, isLimited: false,
    tags: ['photophore', 'céramique', 'nouveauté'],
    images: [IMAGES.photophore, IMAGES.terra, IMAGES.deco02],
    story: "Un photophore en grès nu, sculpté et cuit à haute température. Silhouettes chaudes projetées au soir. Accueille une bougie chauffe-plat.",
    care: 'Essuyer à sec après usage.',
  },
  {
    id: 'p-15', slug: 'coupe-ecorce', name: 'Coupe Écorce',
    category: 'terre', collection: 'terre', price: 145,
    material: 'Grès émaillé', color: 'Rouille & ivoire', style: 'Signature',
    dimensions: 'Ø 26 × H 9 cm', weight: '1,4 kg', makingTime: '6 heures + cuisson',
    stock: 6, isNew: false, isLimited: true,
    tags: ['céramique', 'signature', 'édition limitée'],
    images: [IMAGES.terra, IMAGES.deco04, IMAGES.deco01],
    story: "Une grande coupe basse, comme un plateau de fruits secs. Émail sableux, bord irrégulier — six heures de tour, cuisson haute température. Édition limitée à 30 exemplaires.",
    care: 'Étanche. Lave-vaisselle possible.',
  },
]
