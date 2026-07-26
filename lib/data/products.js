// Catalogue GINETTE Créations - photos artisanales réelles fournies par la maison.
// Prix en EUR. Slugs stables.

export const CATEGORIES = [
  { slug: 'sacs',        name: 'Sacs Crochet', tagline: 'Chaque maille racontée à la main' },
  { slug: 'pulls',       name: 'Pulls Crochet', tagline: 'Le crochet, portable comme jamais' },
  { slug: 'bougies',     name: 'Bougies',      tagline: 'Parfums et cristaux, coulés à la main' },
  { slug: 'bijoux',      name: 'Bijoux',       tagline: 'Petites pièces, grande présence' },
  { slug: 'decoration',  name: 'Décoration',   tagline: "L'âme d'un intérieur" },
  { slug: 'nouveautes',  name: 'Nouveautés',   tagline: 'Les dernières créations' },
  { slug: 'editions-limitees', name: 'Éditions limitées', tagline: 'Numérotées, jamais reproduites' },
]

export const COLLECTIONS = [
  { slug: 'boreale',   name: 'Collection Boréale',   story: 'Les blancs de la neige au réveil.' },
  { slug: 'rivage',    name: 'Collection Rivage',    story: "La lumière tamisée d'une matinée en bord de mer." },
  { slug: 'atelier',   name: 'Collection Atelier',   story: 'Les pièces nées dans nos mains, celles que nous préférons.' },
  { slug: 'equinoxe',  name: 'Collection Équinoxe',  story: 'Le passage. La chaleur qui remplace la fraîcheur.' },
  { slug: 'minerale',  name: 'Collection Minérale',  story: 'La terre, la pierre, le silence.' },
  { slug: 'heritage',  name: 'Collection Héritage',  story: 'Les gestes appris, transmis, préservés.' },
]

// Real product photos supplied by the maison (baby items + bags from Phase 1)
const BOOTIES = 'https://customer-assets-7cd3h4nn.emergentagent.net/job_16983215-f483-48f9-9efe-e8baea0d1238/artifacts/yhbe53yp_COUVERTURE%20ET%20CHAUSSONS.webp'
const BLANKET = 'https://customer-assets-7cd3h4nn.emergentagent.net/job_16983215-f483-48f9-9efe-e8baea0d1238/artifacts/kmstmnfe_couverture.webp'
const BAGS    = 'https://customer-assets-7cd3h4nn.emergentagent.net/job_16983215-f483-48f9-9efe-e8baea0d1238/artifacts/3xwdj2zc_sacs%20crochet.jpeg'

// Real product photos from client zip (served from /public)
const P = (name) => `/products/${name}`

// Editorial lifestyle photography
export const IMAGES = {
  interior1: 'https://images.unsplash.com/photo-1610659856580-323ec67011f9?auto=format&fit=crop&w=1800&q=80',
  interior2: 'https://images.pexels.com/photos/8251400/pexels-photo-8251400.jpeg?auto=compress&cs=tinysrgb&w=1800',
  interior3: 'https://images.unsplash.com/photo-1633505899118-4ca6bd143043?auto=format&fit=crop&w=1800&q=80',
  atelier:   'https://images.pexels.com/photos/38428357/pexels-photo-38428357.jpeg?auto=compress&cs=tinysrgb&w=1800',
  weave:     'https://images.pexels.com/photos/36319631/pexels-photo-36319631.jpeg?auto=compress&cs=tinysrgb&w=1400',
}

export const PRODUCTS = [
  // ============ SACS CROCHET ============
  {
    id: 'p-01', slug: 'sac-crochet-lin-boreal', name: 'Sac Crochet — Lin Boréal',
    category: 'sacs', collection: 'boreale', price: 189,
    material: 'Coton recyclé peigné', color: 'Lin', style: 'Épuré',
    dimensions: '32 × 34 cm', weight: '380 g', makingTime: '18 heures',
    stock: 6, isNew: true, isLimited: false,
    tags: ['artisanal', 'crochet', 'nouveauté'],
    images: [BAGS, BLANKET, IMAGES.weave],
    story: "Ce sac demande près de dix-huit heures de travail. Chaque maille est réalisée entièrement à la main dans notre atelier. Aucune pièce n'est parfaitement identique — c'est ce qui en fait la beauté. Le fil, un coton recyclé peigné dans un ton lin naturel, gagne en douceur au fil des jours.",
    care: 'Lavage à la main à froid. Étendre à plat, à l\u2019abri du soleil.',
  },
  {
    id: 'p-02', slug: 'sac-crochet-safran', name: 'Sac Crochet — Safran',
    category: 'sacs', collection: 'equinoxe', price: 189,
    material: 'Coton recyclé peigné', color: 'Ocre safran', style: 'Solaire',
    dimensions: '32 × 34 cm', weight: '380 g', makingTime: '20 heures',
    stock: 4, isNew: false, isLimited: true,
    tags: ['artisanal', 'édition limitée'],
    images: [BAGS, P('pull-02.jpeg'), IMAGES.interior2],
    story: "Édition limitée à 40 exemplaires. Le safran, teinte solaire réchauffante, s'invite dans ce sac maillé main. Vingt heures de travail patient, un fil sélectionné pour sa tenue et sa douceur.",
    care: 'Lavage à la main à froid. Étendre à plat.',
  },
  {
    id: 'p-03', slug: 'sac-crochet-nuit', name: 'Sac Crochet — Nuit',
    category: 'sacs', collection: 'heritage', price: 195,
    material: 'Coton recyclé peigné', color: 'Anthracite', style: 'Contemporain',
    dimensions: '32 × 34 cm', weight: '380 g', makingTime: '18 heures',
    stock: 8, isNew: false, isLimited: false,
    tags: ['artisanal', 'crochet'],
    images: [BAGS, IMAGES.interior1, IMAGES.weave],
    story: "Un anthracite profond, presque graphite. Ce sac maillé main s'accorde aussi bien au lin blanc de l'été qu'aux textures riches de l'hiver. Fabriqué en France, entièrement au crochet, dans notre atelier de la Drôme.",
    care: 'Lavage à la main à froid. Étendre à plat, à l\u2019abri du soleil.',
  },

  // ============ PULLS CROCHET ============
  {
    id: 'p-04', slug: 'pull-crochet-argile', name: 'Pull Crochet — Argile',
    category: 'pulls', collection: 'atelier', price: 285,
    material: 'Coton peigné + alpaga', color: 'Taupe grisé', style: 'Manches ballon',
    dimensions: 'T. XS/S/M/L — coupe courte', weight: '340 g', makingTime: '28 heures',
    stock: 5, isNew: true, isLimited: false,
    tags: ['pull', 'mode', 'nouveauté'],
    images: [P('pull-01.jpeg'), P('pull-02.jpeg'), IMAGES.interior3],
    story: "Un pull crochet à la maille ajourée, coupe courte et manches ballon volontairement amples. Vingt-huit heures pour un vestiaire précieux, tricoté à la main, à porter sur une jupe midi ou un jean brut. Le taupe grisé se marie à toutes les carnations.",
    care: 'Lavage à la main à froid, séchage à plat sur serviette.',
  },
  {
    id: 'p-05', slug: 'pull-crochet-safran-raye', name: 'Pull Crochet — Safran rayé',
    category: 'pulls', collection: 'equinoxe', price: 295,
    material: 'Coton peigné + laine mérinos', color: 'Safran & sable', style: 'Rayures larges',
    dimensions: 'T. XS/S/M/L — coupe courte', weight: '360 g', makingTime: '32 heures',
    stock: 3, isNew: true, isLimited: true,
    tags: ['pull', 'mode', 'édition limitée'],
    images: [P('pull-02.jpeg'), P('pull-01.jpeg'), IMAGES.interior1],
    story: "Édition limitée. Un pull statement, rayures larges safran et sable, manches bouffantes tricotées main. Trente-deux heures de crochet patient. Une pièce que l'on ne trouve nulle part ailleurs.",
    care: 'Lavage à la main à froid, séchage à plat.',
  },

  // ============ BOUGIES artisanales avec cristaux ============
  {
    id: 'p-06', slug: 'bougie-santal', name: 'Bougie Santal — Œil de tigre',
    category: 'bougies', collection: 'minerale', price: 42,
    material: 'Cire de soja + huile essentielle de santal + pierres d\u2019œil de tigre',
    color: 'Pot noir · cire ivoire', style: 'Boisée',
    dimensions: '180 ml · Ø 6 cm', weight: '260 g', makingTime: '4 heures',
    stock: 18, isNew: true, isLimited: false,
    tags: ['bougie', 'cristaux', 'signature'],
    images: [P('bougie-01.jpeg'), P('bougie-03.jpeg'), IMAGES.interior1],
    story: "Une bougie coulée à la main dans un pot en verre teinté. Cire de soja végétale parfumée à l'huile essentielle de santal, incrustée de pierres brutes d'œil de tigre — pierre du courage et de l'ancrage. Chaque bougie est étiquetée main. Brûle 35 heures.",
    care: 'Laisser la surface se liquéfier entièrement à la première utilisation. Mèche coupée à 5 mm.',
  },
  {
    id: 'p-07', slug: 'bougie-ylang-ylang', name: 'Bougie Ylang-Ylang — Améthyste',
    category: 'bougies', collection: 'atelier', price: 42,
    material: 'Cire de soja + huile essentielle d\u2019ylang-ylang + améthyste',
    color: 'Pot transparent · cire nacrée', style: 'Florale',
    dimensions: '180 ml · Ø 6 cm', weight: '260 g', makingTime: '4 heures',
    stock: 22, isNew: true, isLimited: false,
    tags: ['bougie', 'cristaux', 'nouveauté'],
    images: [P('bougie-02.jpeg'), P('bougie-03.jpeg'), IMAGES.interior3],
    story: "Un parfum floral et sucré, adouci par les vertus apaisantes de l'améthyste. Cire de soja végétale coulée à la main, mèche en coton naturel. Une bougie qui accompagne les fins de journée. Brûle 35 heures.",
    care: 'Première utilisation : laisser fondre entièrement en surface. Mèche coupée à 5 mm.',
  },
  {
    id: 'p-08', slug: 'bougie-bergamote', name: 'Bougie Bergamote — Aventurine',
    category: 'bougies', collection: 'rivage', price: 42,
    material: 'Cire de soja + huile essentielle de bergamote + aventurine verte',
    color: 'Pot vert · cire ivoire', style: 'Agrumes frais',
    dimensions: '180 ml · Ø 6 cm', weight: '260 g', makingTime: '4 heures',
    stock: 20, isNew: false, isLimited: false,
    tags: ['bougie', 'cristaux'],
    images: [P('bougie-05.jpeg'), P('bougie-03.jpeg'), IMAGES.interior2],
    story: "L'agrume vif de la bergamote calabraise, adouci par l'aventurine verte — pierre de l'harmonie. Une bougie fraîche pour les matins, coulée dans un pot en verre vert profond. Brûle 35 heures.",
    care: 'Laisser fondre entièrement en surface à la première utilisation.',
  },
  {
    id: 'p-09', slug: 'bougie-figue', name: 'Bougie Figue — Cornaline',
    category: 'bougies', collection: 'heritage', price: 42,
    material: 'Cire de soja + huile essentielle de figue + cornaline',
    color: 'Pot ambré · cire ivoire', style: 'Fruitée douce',
    dimensions: '180 ml · Ø 6 cm', weight: '260 g', makingTime: '4 heures',
    stock: 16, isNew: false, isLimited: false,
    tags: ['bougie', 'cristaux'],
    images: [P('bougie-04.jpeg'), P('bougie-03.jpeg'), IMAGES.interior1],
    story: "La figue mûre, sensuelle et gourmande, portée par la chaleur de la cornaline — pierre de vitalité. Cire végétale coulée à la main dans un pot en verre ambré. Un parfum qui reste longtemps après la flamme éteinte. Brûle 35 heures.",
    care: 'Mèche coupée à 5 mm. Ne jamais laisser sans surveillance.',
  },
  {
    id: 'p-10', slug: 'coffret-bougies', name: 'Coffret Bougies — Les Quatre Saisons',
    category: 'bougies', collection: 'atelier', price: 148,
    material: 'Cire de soja + 4 bougies parfumées aux cristaux',
    color: 'Coffret carton naturel', style: 'Coffret cadeau',
    dimensions: '4 × 180 ml', weight: '1.1 kg', makingTime: '16 heures',
    stock: 9, isNew: true, isLimited: true,
    tags: ['coffret', 'cadeau', 'bougie', 'édition limitée'],
    images: [P('bougie-03.jpeg'), P('bougie-02.jpeg'), P('bougie-05.jpeg')],
    story: "Nos quatre bougies signature dans un écrin fait main : Santal, Ylang-Ylang, Bergamote, Figue. Chacune est coulée à la main, ornée de pierres brutes différentes. Un cadeau rare pour les êtres qui comptent. Coffret numéroté.",
    care: 'Voir les instructions individuelles de chaque bougie.',
  },

  // ============ BIJOUX ============
  {
    id: 'p-11', slug: 'bracelet-oeil-de-tigre', name: 'Bracelet Élément — Œil de tigre',
    category: 'bijoux', collection: 'minerale', price: 89,
    material: 'Œil de tigre naturel, pierres semi-précieuses, apprêts argentés',
    color: 'Multicolore ocre & bleu', style: 'Perles rondes 10 mm',
    dimensions: 'Ø 18 cm — élastique ajustable', weight: '34 g', makingTime: '2 heures',
    stock: 14, isNew: true, isLimited: false,
    tags: ['bijoux', 'pierres', 'nouveauté'],
    images: [P('bijou-01.jpeg'), P('bijou-03.jpeg'), IMAGES.weave],
    story: "Un bracelet monté à la main, alternant œil de tigre rouge, bleu et doré. Chaque pierre est unique, choisie pour ses reflets. L'œil de tigre est réputé pour ancrer, pour rassembler. Livré dans sa pochette de jute brute.",
    care: 'Éviter le contact prolongé avec l\u2019eau et les parfums.',
  },
  {
    id: 'p-12', slug: 'pendentif-spirale-ocre', name: 'Pendentif Spirale — Ocre',
    category: 'bijoux', collection: 'equinoxe', price: 78,
    material: 'Laiton doré à la main + cornaline naturelle',
    color: 'Doré · ocre', style: 'Spirale sculpturale',
    dimensions: 'Chaîne 45 cm — spirale Ø 3.5 cm', weight: '12 g', makingTime: '3 heures',
    stock: 11, isNew: true, isLimited: false,
    tags: ['bijoux', 'pendentif', 'nouveauté'],
    images: [P('bijou-02.jpeg'), P('bijou-03.jpeg'), IMAGES.interior3],
    story: "Une spirale en laiton doré, façonnée à la main autour d'une pierre de cornaline brute. Le mouvement du fil, comme un geste suspendu. Un pendentif signature qui se porte seul ou superposé.",
    care: 'Retirer avant la douche et le sommeil.',
  },
  {
    id: 'p-13', slug: 'boucles-nomade', name: "Boucles d'oreille — Nomade",
    category: 'bijoux', collection: 'rivage', price: 58,
    material: 'Laiton doré + perles semi-précieuses',
    color: 'Multicolore', style: 'Longues pendantes',
    dimensions: 'L. 6 cm', weight: '4 g', makingTime: '1.5 heure',
    stock: 20, isNew: false, isLimited: false,
    tags: ['bijoux', 'boucles'],
    images: [P('bijou-03.jpeg'), P('bijou-01.jpeg'), IMAGES.interior1],
    story: "Une paire de boucles longues et légères, ornée d'une perle unique de pierre semi-précieuse. Disponible dans plusieurs teintes — chaque exemplaire est monté à la main. Se portent au quotidien sans jamais peser.",
    care: 'Éviter parfum et eau.',
  },
  {
    id: 'p-14', slug: 'parure-souveraine', name: 'Parure Souveraine — Or & Argent',
    category: 'bijoux', collection: 'heritage', price: 245,
    material: 'Laiton doré + argent 925',
    color: 'Bicolore or/argent', style: 'Ligne épurée',
    dimensions: 'Collier 42 cm + boucles 3 cm', weight: '18 g', makingTime: '6 heures',
    stock: 4, isNew: false, isLimited: true,
    tags: ['bijoux', 'parure', 'édition limitée'],
    images: [P('bijou-04.jpeg'), P('bijou-02.jpeg'), IMAGES.interior2],
    story: "Une parure sculpturale composée d'un collier pendentif « figure couronnée » et d'une paire de boucles graphiques. Un dialogue or/argent inspiré des icônes matisiennes. Édition numérotée à 30 exemplaires.",
    care: 'Ranger séparément dans sa pochette de velours fournie.',
  },

  // ============ DÉCORATION ============
  {
    id: 'p-15', slug: 'corbeille-crochet-pivoine', name: 'Corbeilles Crochet — Pivoine',
    category: 'decoration', collection: 'boreale', price: 68,
    material: 'Trapilho (coton tricot recyclé)', color: 'Rose pivoine', style: 'Rangement doux',
    dimensions: 'Ø 14 à 22 cm (3 tailles vendues séparément)', weight: '180 g à 320 g', makingTime: '3 à 5 heures',
    stock: 25, isNew: true, isLimited: false,
    tags: ['panier', 'crochet', 'rangement', 'nouveauté'],
    images: [P('deco-02.jpeg'), P('deco-03.jpeg'), IMAGES.interior3],
    story: "Une famille de corbeilles crochetées à la main en trapilho, un fil épais issu de coton tricot recyclé. Rose pivoine tendre, mailles généreuses. Sur une commode, au pied d'un fauteuil, dans une salle de bain. Vendues à l'unité, disponibles en trois tailles.",
    care: 'Aspirer délicatement. Ne pas laver.',
  },
  {
    id: 'p-16', slug: 'chaussons-adulte-cannelle', name: 'Chaussons d\u2019Intérieur — Cannelle',
    category: 'decoration', collection: 'atelier', price: 62,
    material: 'Laine mérinos brossée', color: 'Cannelle', style: 'Cocooning',
    dimensions: 'T. 36/38 · 39/41 · 42/44', weight: '160 g', makingTime: '6 heures',
    stock: 12, isNew: true, isLimited: false,
    tags: ['chaussons', 'laine', 'nouveauté'],
    images: [P('deco-01.jpeg'), BOOTIES, IMAGES.interior1],
    story: "Des chaussons d'intérieur adulte, crochetés en laine mérinos brossée dans une teinte cannelle chaude. Ornés d'une petite marguerite brodée main. Six heures de travail par paire. La chaleur silencieuse des soirs d'hiver.",
    care: 'Lavage à la main à froid. Sécher à plat.',
  },
  {
    id: 'p-17', slug: 'couverture-eveil', name: "Couverture d'Éveil — Bruyère",
    category: 'decoration', collection: 'atelier', price: 249,
    material: 'Laine mouchetée écologique', color: 'Écru moucheté', style: 'Ajourée',
    dimensions: '90 × 110 cm', weight: '900 g', makingTime: '32 heures',
    stock: 3, isNew: true, isLimited: true,
    tags: ['couverture', 'laine', 'édition limitée'],
    images: [BLANKET, BOOTIES, IMAGES.interior2],
    story: "Trente-deux heures de crochet pour cette couverture pensée comme une caresse. La laine mouchetée, tissée en points ajourés, laisse passer la lumière. Édition limitée à 20 exemplaires numérotés.",
    care: 'Lavage à froid programme laine. Séchage à plat.',
  },
  {
    id: 'p-18', slug: 'chaussons-bebe-nuage', name: 'Chaussons Bébé — Nuage',
    category: 'decoration', collection: 'boreale', price: 45,
    material: 'Laine mérinos', color: 'Écru', style: 'Tendre',
    dimensions: '0 – 6 mois', weight: '30 g', makingTime: '4 heures',
    stock: 12, isNew: true, isLimited: false,
    tags: ['bébé', 'nouveauté', 'laine', 'cadeau'],
    images: [BOOTIES, BLANKET, IMAGES.interior3],
    story: "Les premiers pas. Une paire de chaussons crochetés en laine mérinos très douce, finis d'un ruban de satin bleu nuit. Quatre heures de travail par paire, une attention qui se voit à chaque maille. Un cadeau de naissance pensé pour être conservé.",
    care: 'Lavage à la main, séchage à plat.',
  },
  {
    id: 'p-19', slug: 'plaid-sylvestre', name: 'Plaid Sylvestre — Vert Mousse',
    category: 'decoration', collection: 'minerale', price: 320,
    material: 'Mérinos brut extra-large', color: 'Vert mousse', style: 'Statement chunky',
    dimensions: '130 × 180 cm', weight: '2.4 kg', makingTime: '48 heures',
    stock: 2, isNew: false, isLimited: true,
    tags: ['plaid', 'chunky', 'édition limitée'],
    images: [P('plaid-01.jpeg'), P('plaid-02.jpeg'), P('plaid-03.jpeg')],
    story: "Une pièce généreuse. Le mérinos brut, tressé main en grosses torsades, prend la lumière comme un paysage forestier. Il habille un lit, un canapé, un dossier de fauteuil, et transforme instantanément la pièce. Édition limitée à 12 pièces numérotées.",
    care: 'Nettoyage à sec uniquement. Ne pas mouiller.',
  },

  // ============ NOUVEAUX AJOUTS ============
  {
    id: 'p-20', slug: 'boucles-cornaline-solaire', name: "Boucles d'oreille — Cornaline Solaire",
    category: 'bijoux', collection: 'equinoxe', price: 72,
    material: 'Laiton doré + cornaline naturelle enroulée main',
    color: 'Doré · orange cornaline', style: 'Longues pendantes à spirale',
    dimensions: 'L. 8 cm — pierre Ø 1 cm', weight: '5 g', makingTime: '2 heures',
    stock: 12, isNew: true, isLimited: false,
    tags: ['bijoux', 'boucles', 'nouveauté', 'pierre'],
    images: [P('boucles-cornaline.webp'), P('bijou-02.jpeg'), P('bijou-03.jpeg')],
    story: "Deux longues boucles pendantes, la pierre de cornaline enveloppée à la main dans un fil de laiton doré terminé en spirale. La cornaline, pierre de vitalité, capte la lumière comme un coucher de soleil. Une paire fine et gracieuse, à porter du matin au soir.",
    care: 'Retirer avant la douche. Essuyer avec un chiffon doux.',
  },
  {
    id: 'p-21', slug: 'photophores-macrame-terracotta', name: 'Photophores Suspendus — Macramé Terracotta',
    category: 'decoration', collection: 'heritage', price: 89,
    material: 'Verre ambré + cordon de coton teint terracotta',
    color: 'Ambre & terracotta', style: 'Lumière suspendue',
    dimensions: 'Duo · Ø 8 cm · H. suspension 60 cm', weight: '480 g le duo', makingTime: '5 heures',
    stock: 8, isNew: true, isLimited: false,
    tags: ['photophore', 'macramé', 'lumière', 'nouveauté'],
    images: [P('photophore-01.jpeg'), P('deco-01.jpeg'), P('bougie-03.jpeg')],
    story: "Un duo de photophores en verre ambré, suspendus dans un macramé de cordon terracotta noué à la main. Accroché à une porte, à une poutre, ou à une branche, il diffuse une lumière chaude et tamisée. Vendu par deux, avec ses guirlandes lumineuses LED intégrées.",
    care: 'Épousseter avec un chiffon sec. Ne pas immerger le macramé.',
  },
]

export function findProduct(slug) {
  return PRODUCTS.find((p) => p.slug === slug)
}
