'use client'

import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

const articles = [
  { slug: '1', title: 'Comment décorer un salon scandinave', cat: 'Décoration', img: IMAGES.interior1, excerpt: 'Lumière, matières naturelles, silhouettes sobres. Cinq règles simples pour créer un salon aussi apaisé qu’accueillant.' },
  { slug: '2', title: 'Les tendances déco 2026', cat: 'Tendances', img: IMAGES.ceramic2, excerpt: 'Terres cuites, tons minéraux, retour du crochet. Ce que nous voyons monter dans les intérieurs.' },
  { slug: '3', title: 'Pourquoi choisir le fait main', cat: 'Manifeste', img: IMAGES.atelier, excerpt: 'Trois raisons profondes de refuser la série et de revenir au geste artisanal.' },
  { slug: '4', title: 'Les matières naturelles à privilégier', cat: 'Guide', img: IMAGES.weave, excerpt: 'Coton, lin, chanvre, laine : comment choisir, comment entretenir.' },
  { slug: '5', title: "L'art du crochet moderne", cat: 'Savoir-faire', img: 'https://customer-assets-7cd3h4nn.emergentagent.net/job_16983215-f483-48f9-9efe-e8baea0d1238/artifacts/3xwdj2zc_sacs%20crochet.jpeg', excerpt: 'Loin des napperons, le crochet redevient un langage contemporain.' },
  { slug: '6', title: 'Créer une ambiance chaleureuse', cat: 'Inspiration', img: IMAGES.interior3, excerpt: 'Textures, couleurs, lumière : les leviers concrets pour transformer une pièce.' },
]

export default function JournalPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        <section className="container py-16 md:py-24 border-b border-linen">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}>
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Le Journal</span>
            <h1 className="font-display font-bold text-5xl md:text-7xl mt-4 leading-[0.98] text-balance max-w-3xl">Un magazine sur ce que l'on garde.</h1>
            <p className="text-ink/60 mt-6 max-w-xl leading-relaxed">Nos regards sur la décoration, la matière, l’artisanat. Écrits lentement, comme le reste.</p>
          </motion.div>
        </section>

        <section className="container py-16 md:py-24 grid md:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-12">
          {articles.map((a, i) => (
            <motion.article
              key={a.slug}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, delay: (i % 3) * 0.08 }}
            >
              <Link href="#" className="group block">
                <div className="aspect-[4/5] overflow-hidden bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt={a.title} className="w-full h-full object-cover img-zoom" />
                </div>
                <div className="mt-5">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-terracotta">{a.cat}</div>
                  <h2 className="font-display text-2xl md:text-3xl mt-2 leading-tight group-hover:text-terracotta transition-colors">{a.title}</h2>
                  <p className="text-ink/60 mt-3 leading-relaxed">{a.excerpt}</p>
                </div>
              </Link>
            </motion.article>
          ))}
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
