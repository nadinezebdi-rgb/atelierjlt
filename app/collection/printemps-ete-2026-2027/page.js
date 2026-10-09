import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { getDb } from '@/lib/db'
import PESeasonalPage from '@/components/collection/pe-seasonal-page'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Collection Printemps / Été 2026-2027 — Atelier JLT',
  description:
    'Doux, chaleureux, bien chez soi. Pastels et touches flash en coton, trapilho et rafia. Plaids, coussins, tapis et paniers de la nouvelle saison Atelier JLT.',
}

// Contenu par défaut si rien en DB — editable depuis l'admin
const DEFAULT = {
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

async function loadContent() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_content').findOne({ _id: 'home' })
    const saved = doc?.content?.collectionPE2027 || {}
    // Shallow merge — l'admin peut n'avoir modifié qu'un sous-ensemble
    return {
      ...DEFAULT,
      ...saved,
      palette: Array.isArray(saved.palette) && saved.palette.length > 0 ? saved.palette : DEFAULT.palette,
      materials: Array.isArray(saved.materials) && saved.materials.length > 0 ? saved.materials : DEFAULT.materials,
    }
  } catch {
    return DEFAULT
  }
}

async function loadProducts() {
  try {
    const res = await fetch(
      (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000') +
        '/api/products?cat=pe-2026-2027',
      { cache: 'no-store' }
    )
    const data = await res.json()
    return Array.isArray(data?.products) ? data.products : []
  } catch {
    return []
  }
}

export default async function CollectionPEPage() {
  const [content, products] = await Promise.all([loadContent(), loadProducts()])
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <PESeasonalPage content={content} products={products} />
      <Footer />
      <CartDrawer />
    </div>
  )
}
