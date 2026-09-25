'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/site/product-card'

export default function BestSellers() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products?sort=featured')
      .then((r) => r.json())
      .then((d) => setProducts((d.products || []).slice(0, 4)))
      .catch(() => {})
  }, [])

  return (
    <section className="py-20 md:py-32 bg-ivory">
      <div className="container">
        <div className="flex items-end justify-between mb-12 md:mb-16 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Les intemporelles</span>
            <h2 className="font-display font-bold text-4xl md:text-5xl mt-4 text-balance">Nos meilleures ventes.</h2>
          </div>
          <Link href="/collections" className="group hidden md:inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] hover:text-terracotta transition-colors">
            Tout voir <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>

        <div className="mt-10 md:hidden">
          <Link href="/collections" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.28em]">
            Tout voir <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  )
}
