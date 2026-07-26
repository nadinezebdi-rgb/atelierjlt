'use client'

import Header from '@/components/site/header'
import Footer from '@/components/site/footer'
import CartDrawer from '@/components/site/cart-drawer'
import { motion } from 'framer-motion'
import { IMAGES } from '@/lib/data/products'

const steps = [
  { n: '01', t: 'La matière', d: 'Cotons recyclés, laines nobles, grès, bois massifs. Nous sélectionnons chaque mètre, chaque kilo.' },
  { n: '02', t: 'Le dessin', d: 'Une esquisse au crayon, quelques nuits d’essais. Puis le prototype, patiemment ajusté.' },
  { n: '03', t: 'La main', d: 'Le crochet, le tour, la cuisson, la coupe. Aucune machine ne remplace la main.' },
  { n: '04', t: 'Le contrôle', d: 'Chaque pièce est inspectée, numérotée, enveloppée.' },
]

export default function AtelierPage() {
  return (
    <div className="min-h-screen bg-ivory">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-ink">
          <motion.div initial={{ scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={IMAGES.atelier} alt="L'atelier Ginette" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink/40" />
          </motion.div>
          <div className="relative h-full container flex items-end pb-16">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.3 }} className="text-ivory max-w-2xl">
              <span className="text-[10px] uppercase tracking-[0.36em] text-ivory/70">Notre Atelier</span>
              <h1 className="font-display font-bold text-5xl md:text-7xl mt-4 leading-[0.98] text-balance">Où naît chaque pièce.</h1>
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="container py-20 md:py-28 max-w-3xl">
          <div className="space-y-6 text-lg leading-relaxed text-ink/80">
            <p>Un ancien mas drômois, quelques pièces baignées de lumière. C’est ici que naît Ginette. Un lieu vivant, où le silence du crochet croise le bruit du tour, où les matières sèchent posées sur des planches.</p>
            <p>Nous sommes une petite équipe, cinq mains, une exigence commune : ne rien produire que nous ne voudrions pas garder chez nous.</p>
          </div>
        </section>

        {/* Steps */}
        <section className="bg-cream py-20 md:py-28">
          <div className="container grid md:grid-cols-2 gap-6 md:gap-10">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.9, delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="font-display text-5xl md:text-6xl text-terracotta/60 leading-none">{s.n}</div>
                <div>
                  <h3 className="font-display text-2xl md:text-3xl">{s.t}</h3>
                  <p className="text-ink/70 mt-2 leading-relaxed">{s.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Photo strip */}
        <section className="container py-20 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[IMAGES.ceramic1, IMAGES.weave, IMAGES.ceramic3, IMAGES.basket].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.08 }}
              className="aspect-[3/4] overflow-hidden bg-cream"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="w-full h-full object-cover img-zoom" />
            </motion.div>
          ))}
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
