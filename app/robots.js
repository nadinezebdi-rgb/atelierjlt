export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/compte/'] },
    ],
    sitemap: 'https://atelierjlt.fr/sitemap.xml',
    host: 'https://atelierjlt.fr',
  }
}
