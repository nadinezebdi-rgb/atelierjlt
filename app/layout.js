import './globals.css'
import { Providers } from './providers'
import { Fraunces, Inter } from 'next/font/google'

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL('https://atelierginette.fr'),
  title: {
    default: 'Atelier Ginette — Maison française de décoration artisanale',
    template: '%s · Atelier Ginette',
  },
  description:
    "Les objets qui donnent une âme à votre intérieur. Chaque création Ginette est imaginée, fabriquée et assemblée à la main dans notre atelier français.",
  applicationName: 'Atelier Ginette',
  keywords: [
    'décoration artisanale française',
    'crochet fait main',
    'sac crochet',
    'plaid chunky',
    'bougies parfumées cristaux',
    'bijoux artisanaux',
    'atelier ginette',
  ],
  authors: [{ name: 'Atelier Ginette', url: 'https://atelierginette.fr' }],
  alternates: {
    canonical: 'https://atelierginette.fr',
    languages: {
      'fr-FR': 'https://atelierginette.fr',
    },
  },
  openGraph: {
    title: 'Atelier Ginette',
    description: 'Maison française de décoration artisanale.',
    url: 'https://atelierginette.fr',
    siteName: 'Atelier Ginette',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: '/api/img/lifestyle-plaid',
        width: 1024,
        height: 1024,
        alt: 'Une scène chez Ginette — plaid crochet et coussins',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atelier Ginette',
    description: 'Maison française de décoration artisanale.',
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${fraunces.variable} ${inter.variable}`}>
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
