import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import Link from 'next/link'
import { IMAGES } from '@/lib/data/products'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Journal · Atelier JLT',
  description: 'Nos regards sur la décoration, la matière, l’artisanat. Un magazine sur ce que l’on garde.',
}

// Article vedette éditorial hardcodé (existant)
const FEATURED = {
  slug: 'tendances-deco-2026-2027',
  href: '/journal/tendances-deco-2026-2027',
  title: 'Tendances déco 2026-2027 : couleurs, matières et crochet',
  cat: 'Tendances',
  img: IMAGES.heroBeige,
  excerpt:
    'Terre cuite, tons minéraux, retour du crochet et accents Luminous Blue pour 2027. Nos idées pour créer un intérieur chaleureux.',
  featured: true,
}

async function getPublishedPosts() {
  try {
    const db = await getDb()
    return await db.collection('blog_posts')
      .find({ published: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray()
  } catch (e) { return [] }
}

export default async function JournalPage() {
  const dbPosts = await getPublishedPosts()

  // Fusionne : article vedette hardcodé + posts DB (sauf s'il y a doublon slug)
  const dbSlugs = new Set(dbPosts.map((p) => p.slug))
  const merged = [
    ...(dbSlugs.has(FEATURED.slug) ? [] : [FEATURED]),
    ...dbPosts.map((p) => ({
      slug: p.slug,
      href: `/journal/${p.slug}`,
      title: p.title,
      cat: p.category || 'Journal',
      img: p.image || IMAGES.interior1,
      excerpt: p.excerpt || '',
      featured: false,
    })),
  ]

  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        <section className="container py-16 md:py-24 border-b border-linen">
          <div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Le Journal</span>
            <h1
              className="font-display font-normal text-5xl md:text-7xl mt-4 leading-[0.98] text-balance max-w-3xl"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              Un magazine sur ce que l&apos;on garde.
            </h1>
            <p className="text-ink/60 mt-6 max-w-xl leading-relaxed">
              Nos regards sur la décoration, la matière, l&rsquo;artisanat. Écrits lentement, comme le reste.
            </p>
          </div>
        </section>

        {merged.length === 0 ? (
          <section className="container py-24 text-center">
            <p className="text-ink/50 italic">Aucun article publié pour l&rsquo;instant. Revenez bientôt.</p>
          </section>
        ) : (
          <section className="container py-16 md:py-24 grid md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
            {merged.map((a) => (
              <article key={a.slug}>
                <Link href={a.href} className="group block">
                  <div className="aspect-[4/5] overflow-hidden bg-cream relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={a.img} alt={a.title} className="w-full h-full object-cover img-zoom" />
                    {a.featured && (
                      <span className="absolute top-4 left-4 bg-emerald text-ivory text-[10px] uppercase tracking-[0.22em] px-3 py-1.5">
                        À lire
                      </span>
                    )}
                  </div>
                  <div className="mt-5">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-terracotta">{a.cat}</div>
                    <h2 className="font-display text-2xl md:text-3xl mt-2 leading-tight group-hover:text-terracotta transition-colors">
                      {a.title}
                    </h2>
                    <p className="text-ink/60 mt-3 leading-relaxed">{a.excerpt}</p>
                    <span className="inline-block mt-4 text-[10px] uppercase tracking-[0.28em] text-emerald border-b border-emerald/30 group-hover:border-emerald pb-0.5">
                      Lire l&rsquo;article →
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
