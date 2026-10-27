import { NextResponse } from '../../shared'
import { getDb } from '@/lib/db'
import { sendMail, emailConfigured, emailLayout, escHtml, ownerEmail } from '@/lib/email'

// GET  /api/admin/emails        → état de l'envoi + 50 derniers emails
// POST /api/admin/emails {to}   → email de test
export async function handle({ request, method }) {
  const db = await getDb()
  if (method === 'GET') {
    const logs = await db.collection('email_logs').find({}).sort({ createdAt: -1 }).limit(50).toArray()
    return NextResponse.json({ configured: emailConfigured(), ownerEmail: ownerEmail(), logs })
  }
  if (method === 'POST') {
    const body = await request.json().catch(() => ({}))
    const to = String(body.to || ownerEmail()).trim()
    if (!to.includes('@')) return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    const r = await sendMail({
      kind: 'test', to,
      subject: 'Email de test — Atelier JLT',
      text: "Ceci est un email de test : l'envoi des emails de votre boutique fonctionne.",
      html: emailLayout(`<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">Ceci est un email de test : l'envoi des emails de votre boutique fonctionne.</p><p style="font-family:Arial,sans-serif;font-size:13px;color:#777">Envoyé à ${escHtml(to)}</p>`),
    })
    return NextResponse.json(r, { status: r.ok ? 200 : 502 })
  }
  return null
}
