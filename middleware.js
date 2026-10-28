import { NextResponse } from 'next/server'

// Anciennes collections « Racine » et « Empreinte » (fusionnées dans « Les Intemporels ») :
// tout ancien lien est redirigé définitivement vers la collection actuelle.
const LEGACY = /^(racine|empreinte)$/i

export function middleware(request) {
  const url = request.nextUrl
  let changed = false
  for (const key of ['cat', 'collection']) {
    const v = url.searchParams.get(key)
    if (v && LEGACY.test(v)) { url.searchParams.set(key, 'intemporels'); changed = true }
  }
  if (!changed) return NextResponse.next()
  return NextResponse.redirect(url, 301)
}

export const config = { matcher: ['/collections'] }
