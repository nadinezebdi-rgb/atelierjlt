import { notFound } from 'next/navigation'
import { marked } from 'marked'
import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import ShareButtons from '@/components/site/share-buttons'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDb } from '@/lib/db'

// Empêche le cache statique pour que les changements CMS soient visibles immédiatement
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPost(slug) {
  try {
    const db = await getDb()
    return await db.collection('blog_posts').findOne({ slug, published: true })
  } catch (e) {
    return null
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: 'Article introuvable · Atelier JLT' }
  const url = `https://atelierjlt.fr/journal/${post.slug}`
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords || [],
    alternates: { canonical: url },
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      url,
      type: 'article',
      publishedTime: post.publishedAt || post.createdAt,
      authors: [post.author || 'Atelier JLT'],
      siteName: 'Atelier JLT',
      images: post.image ? [{ url: post.image, alt: post.imageAlt || post.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.image ? [post.image] : [],
    },
  }
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const html = marked.parse(post.content || '', { breaks: true, gfm: true })
  const url = `https://atelierjlt.fr/journal/${post.slug}`
  const dateStr = new Date(post.publishedAt || post.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.image ? [post.image] : [],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: [{ '@type': 'Organization', name: post.author || 'Atelier JLT', url: 'https://atelierjlt.fr' }],
    publisher: {
      '@type': 'Organization',
      name: 'Atelier JLT',
      logo: { '@type': 'ImageObject', url: 'https://atelierjlt.fr/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: (post.keywords || []).join(', '),
    articleSection: post.category || 'Journal',
    inLanguage: 'fr-FR',
  }

  return (
    <div className="min-h-screen bg-ivory">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Header />
      <main>
        {/* Fil d'ariane */}
        <div className="container pt-6 pb-2 text-[11px] uppercase tracking-[0.22em] text-ink/50">
          <Link href="/" className="hover:text-ink">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/journal" className="hover:text-ink">Journal</Link>
          <span className="mx-2">/</span>
          <span className="text-ink truncate">{post.title}</span>
        </div>

        {/* En-tête */}
        <header className="container pt-8 md:pt-12 pb-10 md:pb-16 border-b border-linen">
          <div className="max-w-3xl">
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">
              Le Journal · {post.category || 'Journal'}
            </span>
            <h1
              className="font-display font-normal text-4xl md:text-6xl leading-[1.02] mt-5 text-balance"
              style={{ fontFamily: 'var(--font-logo), var(--font-display), serif', fontWeight: 400 }}
            >
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 text-lg text-ink/70 leading-relaxed max-w-2xl">
                {post.excerpt}
              </p>
            )}
            <div className="mt-6 flex items-center flex-wrap gap-4 text-[11px] uppercase tracking-[0.22em] text-ink/50">
              <span>{post.author || 'Atelier JLT'}</span>
              <span className="text-ink/25">·</span>
              <time dateTime={post.publishedAt || post.createdAt}>{dateStr}</time>
              {post.readingTime && (
                <>
                  <span className="text-ink/25">·</span>
                  <span>Lecture {post.readingTime}</span>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Image d'ouverture */}
        {post.image && (
          <figure className="container pt-10 md:pt-16">
            <div className="relative aspect-[16/9] overflow-hidden bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="w-full h-full object-cover"
              />
            </div>
            {post.imageAlt && (
              <figcaption className="mt-4 text-[12px] text-ink/50 italic max-w-3xl">
                {post.imageAlt}
              </figcaption>
            )}
          </figure>
        )}

        {/* Corps de l'article — markdown converti */}
        <article className="container py-12 md:py-20 max-w-3xl">
          <div
            className="prose-article"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <ShareButtons url={`/journal/${post.slug}`} title={post.title} image={post.image} />

          <div className="mt-16 pt-10 border-t border-linen flex items-center justify-between">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-ink/60 hover:text-emerald transition"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.5} /> Retour au Journal
            </Link>
            <Link
              href="/collections"
              className="inline-block text-[11px] uppercase tracking-[0.28em] text-emerald border-b border-emerald/40 hover:border-emerald pb-0.5"
            >
              Découvrir nos pièces
            </Link>
          </div>
        </article>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
