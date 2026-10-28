import { NextResponse } from 'next/server'

// Les collections ont été retirées du site. Tout ancien lien (?cat=intemporels,
// ?collection=…, /collection/printemps-ete-2026-2027…) mène désormais à tous les produits.
// Seules les sélections « nouveautes » et « editions-limitees » restent.
const KEEP_CAT = new Set(['nouveautes', 'editions-limitees'])

export function middleware(request) {
  const url = request.nextUrl.clone()
  if (url.pathname.startsWith('/collection/')) {
    url.pathname = '/produits'
    url.search = ''
    return NextResponse.redirect(url, 301)
  }
  let changed = false
  const cat = url.searchParams.get('cat')
  if (cat && !KEEP_CAT.has(cat)) { url.searchParams.delete('cat'); changed = true }
  if (url.searchParams.has('collection')) { url.searchParams.delete('collection'); changed = true }
  if (!changed) return NextResponse.next()
  return NextResponse.redirect(url, 301)
}

export const config = { matcher: ['/collections', '/produits', '/collection/:path*'] }
