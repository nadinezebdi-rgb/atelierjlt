import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { PRODUCTS as BASE_PRODUCTS } from '@/lib/data/products'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/chat/insights → suggestions proactives pour l'admin.
 * Renvoie une liste d'issues avec { id, severity, title, hint, prompt } :
 *  - prompt = phrase pré-remplie à envoyer à Juliette en un clic
 */
export async function GET(request) {
  if (!isAdmin(request)) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const db = await getDb()
  const [overrides, custom, siteContent, blogPosts] = await Promise.all([
    db.collection('product_overrides').find({}).toArray(),
    db.collection('products_custom').find({}).toArray(),
    db.collection('site_content').findOne({ _id: 'home' }),
    db.collection('blog_posts').find({}).toArray(),
  ])
  const overrideMap = new Map(overrides.map((o) => [o.slug, o.data]))
  const products = BASE_PRODUCTS.map((p) => ({ ...p, ...(overrideMap.get(p.slug) || {}) }))
    .concat(custom.map((c) => ({ ...c.data, slug: c.slug })))

  const insights = []

  /* ==== Produits sans image ==== */
  const missingImg = products.filter((p) => !p.images || p.images.length === 0)
  missingImg.slice(0, 5).forEach((p) => {
    insights.push({
      id: `img-${p.slug}`,
      severity: 'warning',
      icon: 'image',
      title: `${p.name} n'a pas d'image`,
      hint: 'Produit sans visuel — invisible dans le carrousel',
      prompt: `Le produit "${p.name}" n'a pas d'image. Suggère-moi une description enrichie pour l'attirer davantage l'attention.`,
    })
  })

  /* ==== Stock faible ==== */
  const lowStock = products.filter((p) => p.stock !== undefined && p.stock !== null && p.stock <= 2 && p.stock > 0)
  lowStock.slice(0, 5).forEach((p) => {
    insights.push({
      id: `stock-${p.slug}`,
      severity: 'warning',
      icon: 'package',
      title: `${p.name} : plus que ${p.stock} en stock`,
      hint: 'Prévois un réapprovisionnement rapide',
      prompt: `Le produit "${p.name}" est presque en rupture (${p.stock} restant). Écris un mini-message d'urgence pour la page produit qui joue sur la rareté.`,
    })
  })

  /* ==== Ruptures ==== */
  const outOfStock = products.filter((p) => p.stock === 0)
  outOfStock.slice(0, 3).forEach((p) => {
    insights.push({
      id: `oos-${p.slug}`,
      severity: 'critical',
      icon: 'alertTriangle',
      title: `${p.name} en rupture`,
      hint: 'Le produit est affiché mais indisponible',
      prompt: `Le produit "${p.name}" est en rupture. Propose-moi soit de le masquer, soit un message qui invite à s'inscrire en liste d'attente.`,
    })
  })

  /* ==== Description trop courte ==== */
  const thinDesc = products.filter((p) => {
    const d = p.description || p.story || ''
    return d.length > 0 && d.length < 80
  })
  thinDesc.slice(0, 3).forEach((p) => {
    insights.push({
      id: `desc-${p.slug}`,
      severity: 'info',
      icon: 'edit',
      title: `Description trop courte : ${p.name}`,
      hint: 'Moins de 80 caractères — enrichis-la pour le SEO',
      prompt: `Ré-écris la description du produit "${p.name}" en 2 paragraphes courts qui mettent en valeur les matières et le savoir-faire artisanal.`,
    })
  })

  /* ==== Hero sans image ==== */
  const hero = siteContent?.content?.hero
  if (hero && !hero.image) {
    insights.push({
      id: 'hero-img',
      severity: 'critical',
      icon: 'image',
      title: 'La bannière principale n\'a pas d\'image',
      hint: 'Le hero de l\'accueil est visuellement vide',
      prompt: 'La bannière principale n\'a pas d\'image. Propose-moi une image type (lifestyle chaleureux) et un titre qui donne envie.',
    })
  }

  /* ==== Brouillons de blog non publiés ==== */
  const drafts = blogPosts.filter((b) => !b.published)
  if (drafts.length > 0) {
    insights.push({
      id: 'blog-drafts',
      severity: 'info',
      icon: 'bookOpen',
      title: `${drafts.length} article${drafts.length > 1 ? 's' : ''} en brouillon`,
      hint: 'Publie-les pour enrichir le blog',
      prompt: `J'ai ${drafts.length} article(s) de blog en brouillon (${drafts.map((d) => d.title).slice(0, 3).join(', ')}). Résume-moi de quoi ils parlent et lequel je devrais publier en priorité.`,
    })
  }

  /* ==== Aucun article publié depuis 30j ==== */
  const now = Date.now()
  const recentPublished = blogPosts.filter((b) => b.published && b.createdAt && (now - new Date(b.createdAt).getTime()) < 30 * 24 * 3600 * 1000)
  if (blogPosts.length > 0 && recentPublished.length === 0) {
    insights.push({
      id: 'blog-stale',
      severity: 'info',
      icon: 'bookOpen',
      title: 'Aucun article publié ce mois-ci',
      hint: 'Ton journal éditorial se rafraîchit doucement',
      prompt: 'Aucun nouvel article de blog n\'a été publié ce mois-ci. Propose-moi 3 idées d\'articles pour la saison en cours.',
    })
  }

  /* ==== Nombre de sections d'accueil masquées ==== */
  const sections = siteContent?.content?.sections || []
  const hidden = sections.filter((s) => s.visible === false)
  if (hidden.length > 3) {
    insights.push({
      id: 'sections-hidden',
      severity: 'info',
      icon: 'eye',
      title: `${hidden.length} sections masquées sur l'accueil`,
      hint: 'Ta page d\'accueil est peut-être trop courte',
      prompt: `J'ai ${hidden.length} sections masquées sur l'accueil. Lesquelles je devrais réactiver pour enrichir la page ?`,
    })
  }

  return NextResponse.json({
    insights: insights.slice(0, 12),
    counts: {
      total: insights.length,
      critical: insights.filter((i) => i.severity === 'critical').length,
      warning: insights.filter((i) => i.severity === 'warning').length,
      info: insights.filter((i) => i.severity === 'info').length,
    },
  })
}
