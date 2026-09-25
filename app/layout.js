import './globals.css'
import { Providers } from './providers'
import { Fraunces, Inter, Instrument_Serif } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-logo',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://atelierjlt.fr'),
  title: {
    default: 'Atelier JLT — Maison française de décoration artisanale',
    template: '%s · Atelier JLT',
  },
  description:
    "Les objets qui donnent une âme à votre intérieur. Chaque création Atelier JLT est imaginée, fabriquée et assemblée à la main dans notre atelier français. Plaids, coussins, macramé, tapis, poterie.",
  applicationName: 'Atelier JLT',
  keywords: [
    'décoration artisanale française',
    'plaid crochet',
    'coussin fait main',
    'macramé mural',
    'tapis artisanal',
    'poterie céramique',
    'atelier jlt',
  ],
  authors: [{ name: 'Atelier JLT', url: 'https://atelierjlt.fr' }],
  alternates: {
    canonical: 'https://atelierjlt.fr',
    languages: {
      'fr-FR': 'https://atelierjlt.fr',
    },
  },
  openGraph: {
    title: 'Atelier JLT',
    description: 'Maison française de décoration artisanale.',
    url: 'https://atelierjlt.fr',
    siteName: 'Atelier JLT',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/api/img/lifestyle-plaid',
        width: 1024,
        height: 1024,
        alt: 'Une scène Atelier JLT — plaid crochet et coussins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atelier JLT',
    description: 'Maison française de décoration artisanale.',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${instrumentSerif.variable} ${inter.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);',
          }}
        />
      </head>
      <body className="font-sans antialiased bg-ivory text-ink selection:bg-terracotta/20 selection:text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
