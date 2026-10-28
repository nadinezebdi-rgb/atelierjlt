import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'
import { unsubscribeToken } from '@/lib/email'

// GET /api/emails/unsubscribe?u=<userId>&t=<token> — désinscription des relances panier
export async function handle({ method, sub, url }) {
  if (sub !== 'unsubscribe' || method !== 'GET') return null
  const u = url.searchParams.get('u') || ''
  const t = url.searchParams.get('t') || ''
  const ok = u && t && t === unsubscribeToken(u)
  if (ok) {
    const db = await getDb()
    await db.collection('users').updateOne({ _id: u }, { $set: { cartRemindersOptOut: true } })
  }
  const msg = ok
    ? 'C’est noté : vous ne recevrez plus de rappels pour votre panier.'
    : 'Ce lien n’est pas valide.'
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Atelier JLT</title></head>
  <body style="margin:0;font-family:Georgia,serif;background:#F6F1EA;color:#211E1A;display:flex;min-height:100vh;align-items:center;justify-content:center">
    <div style="max-width:460px;margin:24px;background:#FFFDF9;border:1px solid #E8DFD2;padding:36px;text-align:center">
      <div style="font-size:26px;color:#0F5C3F;margin-bottom:18px">Atelier JLT</div>
      <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">${msg}</p>
      <p style="margin-top:24px"><a href="/" style="color:#0F5C3F;font-family:Arial,sans-serif;font-size:13px">Retour à la boutique</a></p>
    </div>
  </body></html>`
  return new NextResponse(html, { status: ok ? 200 : 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
