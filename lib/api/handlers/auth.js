import crypto from 'node:crypto'
import { v4 as uuid } from 'uuid'
import { sendPasswordResetEmail } from '@/lib/email'
import { NextResponse } from '../shared'
import { getDb } from '@/lib/db'
import {
  hashPassword, verifyPassword,
  setClientSession, clearClientSession, getClientUserId,
  setAdminSession, clearAdminSession, isAdmin,
} from '@/lib/auth'

export async function handle({ request, method, sub }) {
  const body = method === 'POST' ? await request.json().catch(() => ({})) : {}
  const db = await getDb()

  if (sub === 'register' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase()
    const password = body.password || ''
    const name = (body.name || '').trim()
    if (!email.includes('@') || password.length < 6) {
      return NextResponse.json({ error: 'Email invalide ou mot de passe trop court (min 6)' }, { status: 400 })
    }
    const existing = await db.collection('users').findOne({ email })
    if (existing) return NextResponse.json({ error: 'Un compte existe déjà avec cet email' }, { status: 409 })
    const passwordHash = await hashPassword(password)
    const id = uuid()
    await db.collection('users').insertOne({
      _id: id, email, name, passwordHash, createdAt: new Date(),
      addresses: [], loyaltyPoints: 0,
    })
    const res = NextResponse.json({ ok: true, user: { id, email, name } })
    setClientSession(res, id)
    return res
  }

  if (sub === 'login' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase()
    const user = await db.collection('users').findOne({ email })
    if (!user || !(await verifyPassword(body.password || '', user.passwordHash))) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true, user: { id: user._id, email: user.email, name: user.name } })
    setClientSession(res, user._id)
    return res
  }

  if (sub === 'logout' && method === 'POST') {
    const res = NextResponse.json({ ok: true })
    clearClientSession(res)
    return res
  }

  if (sub === 'me' && method === 'GET') {
    const uid = getClientUserId(request)
    if (!uid) return NextResponse.json({ user: null })
    const user = await db.collection('users').findOne({ _id: uid })
    if (!user) return NextResponse.json({ user: null })
    const { passwordHash, resetTokenHash, resetTokenExpiresAt, resetRequestedAt, ...safe } = user
    return NextResponse.json({ user: { ...safe, id: user._id } })
  }

  // Mot de passe oublié : réponse identique que le compte existe ou non.
  if (sub === 'forgot-password' && method === 'POST') {
    const email = (body.email || '').trim().toLowerCase()
    const generic = NextResponse.json({ ok: true, message: 'Si un compte existe avec cette adresse, un email vient de vous être envoyé.' })
    if (!email.includes('@')) return generic
    const user = await db.collection('users').findOne({ email })
    if (!user) return generic
    // Anti-spam : un email maximum par minute et par compte
    if (user.resetRequestedAt && Date.now() - new Date(user.resetRequestedAt).getTime() < 60_000) return generic
    const raw = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    await db.collection('users').updateOne({ _id: user._id }, {
      $set: { resetTokenHash: hash, resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000), resetRequestedAt: new Date() },
    })
    const base = (process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/$/, '')
    await sendPasswordResetEmail({ to: user.email, name: user.name, link: `${base}/compte/reinitialiser?token=${raw}` })
    return generic
  }

  if (sub === 'reset-password' && method === 'POST') {
    const raw = String(body.token || '')
    const password = body.password || ''
    if (password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court (min 6)' }, { status: 400 })
    if (!raw) return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    const hash = crypto.createHash('sha256').update(raw).digest('hex')
    const user = await db.collection('users').findOne({ resetTokenHash: hash, resetTokenExpiresAt: { $gt: new Date() } })
    if (!user) return NextResponse.json({ error: 'Lien invalide ou expiré. Demandez un nouveau lien.' }, { status: 400 })
    await db.collection('users').updateOne({ _id: user._id }, {
      $set: { passwordHash: await hashPassword(password), passwordChangedAt: new Date() },
      $unset: { resetTokenHash: '', resetTokenExpiresAt: '', resetRequestedAt: '' },
    })
    const res = NextResponse.json({ ok: true })
    setClientSession(res, user._id)
    return res
  }

  // Admin login
  if (sub === 'admin-login' && method === 'POST') {
    if ((body.password || '') !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Mot de passe admin invalide' }, { status: 401 })
    }
    const res = NextResponse.json({ ok: true })
    setAdminSession(res)
    return res
  }
  if (sub === 'admin-logout' && method === 'POST') {
    const res = NextResponse.json({ ok: true })
    clearAdminSession(res)
    return res
  }
  if (sub === 'admin-status' && method === 'GET') {
    return NextResponse.json({ isAdmin: isAdmin(request) })
  }

  return null
}
