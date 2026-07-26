export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/compte/'] },
    ],
    sitemap: 'https://atelierginette.fr/sitemap.xml',
    host: 'https://atelierginette.fr',
  }
}
