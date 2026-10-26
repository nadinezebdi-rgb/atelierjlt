// Pages d'information (CGV, livraison, suivi, confidentialité) + footer.
//   GET /api/site-pages/footer       → { footer }
//   GET /api/site-pages/<slug>       → { page }
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'
import { LEGAL_SLUGS, mergeLegalPage, mergeFooter } from '@/lib/legal-defaults'

export async function loadFooter() {
  try {
    const db = await getDb()
    const doc = await db.collection('site_pages').findOne({ _id: 'footer' })
    return mergeFooter(doc?.data)
  } catch {
    return mergeFooter(null)
  }
}

export async function loadLegalPage(slug) {
  try {
    const db = await getDb()
    const doc = await db.collection('site_pages').findOne({ _id: slug })
    return mergeLegalPage(slug, doc?.data ? { ...doc.data, updatedAt: doc.updatedAt } : null)
  } catch {
    return mergeLegalPage(slug, null)
  }
}

export async function handle({ method, sub }) {
  if (method !== 'GET') return null
  if (sub === 'footer') return NextResponse.json({ footer: await loadFooter() })
  if (LEGAL_SLUGS.includes(sub)) return NextResponse.json({ page: await loadLegalPage(sub) })
  return NextResponse.json({ error: 'Page introuvable' }, { status: 404 })
}

// Admin : GET tout / PATCH une page
export async function handleAdmin({ request, method, sub2 }) {
  const db = await getDb()
  if (method === 'GET') {
    const pages = {}
    for (const s of LEGAL_SLUGS) pages[s] = await loadLegalPage(s)
    return NextResponse.json({ pages, footer: await loadFooter() })
  }
  if (method === 'PATCH' || method === 'PUT') {
    const slug = sub2
    if (slug !== 'footer' && !LEGAL_SLUGS.includes(slug)) {
      return NextResponse.json({ error: 'Page inconnue' }, { status: 400 })
    }
    const body = await request.json().catch(() => ({}))
    let data
    if (slug === 'footer') {
      const str = (v, max = 400) => (typeof v === 'string' ? v.slice(0, max) : undefined)
      const links = {}
      for (const k of LEGAL_SLUGS) {
        const l = body.clientLinks?.[k] || {}
        links[k] = { label: str(l.label, 80) || '', show: l.show !== false }
      }
      data = {
        tagline: str(body.tagline), email: str(body.email, 120), instagram: str(body.instagram, 300),
        facebook: str(body.facebook, 300), copyright: str(body.copyright, 160), bottomNote: str(body.bottomNote, 160),
        cookieText: str(body.cookieText, 600),
        clientLinks: links,
      }
      Object.keys(data).forEach((k) => data[k] === undefined && delete data[k])
    } else {
      const sections = Array.isArray(body.sections)
        ? body.sections.slice(0, 60).map((s) => ({ title: String(s?.title || '').slice(0, 200), text: String(s?.text || '').slice(0, 20000) }))
        : undefined
      data = { title: String(body.title || '').slice(0, 200), intro: String(body.intro || '').slice(0, 4000) }
      if (sections) data.sections = sections
    }
    await db.collection('site_pages').updateOne(
      { _id: slug },
      { $set: { data, updatedAt: new Date().toISOString() } },
      { upsert: true }
    )
    return NextResponse.json({ ok: true })
  }
  return null
}
