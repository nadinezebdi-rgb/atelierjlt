import { NextResponse } from 'next/server'

// Collections actives : « Les Intemporels » (?cat=intemporels) et
// « Printemps/Été 2027 » (/collection/printemps-ete-2027).
// Les anciennes collections Racine / Empreinte sont fusionnées dans Les Intemporels ;
// Terre n'existe plus. Redirections temporaires (307) pour ne rien figer dans les navigateurs.
export const PE_PATH = '/collection/printemps-ete-2027'
const LEGACY_TO_INTEMPORELS = /^(racine|empreinte)$/i
const DROPPED = /^(terre)$/i

export function middleware(request) {
  const url = request.nextUrl.clone()
  if (url.pathname.startsWith('/collection/')) {
    if (url.pathname === PE_PATH) return NextResponse.next()
    // Ancienne adresse de la collection printemps/été → nouvelle ; tout autre lien → produits
    url.pathname = /printemps|ete/i.test(url.pathname) ? PE_PATH : '/produits'
    url.search = ''
    return NextResponse.redirect(url, 307)
  }
  let changed = false
  for (const key of ['cat', 'collection']) {
    const v = url.searchParams.get(key)
    if (!v) continue
    if (LEGACY_TO_INTEMPORELS.test(v)) { url.searchParams.set(key, 'intemporels'); changed = true }
    else if (DROPPED.test(v)) { url.searchParams.delete(key); changed = true }
  }
  // La collection printemps/été a sa propre page (couleurs, ambiances, pièces)
  const cat = url.searchParams.get('cat') || url.searchParams.get('collection')
  if (cat === 'pe-2026-2027') {
    url.pathname = PE_PATH
    url.search = ''
    return NextResponse.redirect(url, 307)
  }
  if (!changed) return NextResponse.next()
  return NextResponse.redirect(url, 307)
}

export const config = { matcher: ['/collections', '/produits', '/collection/:path*'] }
