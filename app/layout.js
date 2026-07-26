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
  title: 'GINETTE Créations — Maison française de décoration artisanale',
  description:
    'Les objets qui donnent une âme à votre intérieur. Chaque création Ginette est imaginée, fabriquée et assemblée à la main en France.',
  openGraph: {
    title: 'GINETTE Créations',
    description: 'Maison française de décoration artisanale.',
    type: 'website',
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
