import Link from 'next/link'
import { Instagram, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-ink text-ivory mt-24 pt-20 pb-8">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8">
          <div className="col-span-2 md:col-span-2 pr-6">
            <div className="font-display text-3xl font-black leading-none">Ginette</div>
            <div className="text-[10px] tracking-[0.4em] uppercase mt-2 opacity-70">Créations</div>
            <p className="mt-6 text-sm leading-relaxed text-ivory/70 max-w-sm">
              Maison française de décoration artisanale.
              Imaginé, fabriqué et assemblé à la main dans notre atelier de la Drôme.
            </p>
            <a href="mailto:bonjour@atelierginette.fr" className="inline-block mt-4 text-sm text-ivory/80 hover:text-terracotta transition-colors">
              bonjour@atelierginette.fr
            </a>
            <div className="flex gap-4 mt-6">
              <a href="https://www.instagram.com/ginette.creations/" target="_blank" rel="noopener" aria-label="Instagram" className="hover:opacity-70 transition"><Instagram className="h-4 w-4" strokeWidth={1.5} /></a>
              <a href="https://www.facebook.com/ginette.creations/" target="_blank" rel="noopener" aria-label="Facebook" className="hover:opacity-70 transition"><Facebook className="h-4 w-4" strokeWidth={1.5} /></a>
            </div>
          </div>
          <FooterCol title="Maison" items={[
            ['Notre histoire', '/histoire'],
            ["L'atelier", '/atelier'],
            ['Journal', '/journal'],
            ['Nous contacter', '/contact'],
          ]} />
          <FooterCol title="Boutique" items={[
            ['Toutes les collections', '/collections'],
            ['Nouveautés', '/collections?cat=nouveautes'],
            ['Éditions limitées', '/collections?cat=editions-limitees'],
            ['Cartes cadeaux', '/carte-cadeau'],
          ]} />
          <FooterCol title="Client" items={[
            ['Mon compte', '/compte'],
            ['Suivi de commande', '/suivi'],
            ['Livraison & retours', '/livraison'],
            ['CGV', '/cgv'],
          ]} />
        </div>
        <div className="mt-16 pt-6 border-t border-ivory/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] uppercase tracking-[0.3em] text-ivory/50">
          <span>© {new Date().getFullYear()} Ginette Créations — Made in France</span>
          <span>Paiement sécurisé · Stripe · Apple Pay · PayPal</span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, items }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.3em] text-ivory/50 mb-4">{title}</div>
      <ul className="space-y-2.5 text-sm text-ivory/80">
        {items.map(([label, href]) => (
          <li key={label}><Link href={href} className="hover:text-terracotta transition-colors">{label}</Link></li>
        ))}
      </ul>
    </div>
  )
}
