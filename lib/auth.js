import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const CLIENT_COOKIE = 'ginette_session'
const ADMIN_COOKIE = 'ginette_admin'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function hashPassword(pw) {
  return bcrypt.hash(pw, 10)
}

export async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function verifyToken(token) {
  if (!token) return null
  try { return jwt.verify(token, JWT_SECRET) } catch { return null }
}

// ---- Client session ----
export function setClientSession(res, userId) {
  const token = signToken({ userId, type: 'client' })
  res.cookies.set(CLIENT_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: MAX_AGE,
  })
}

export function clearClientSession(res) {
  res.cookies.set(CLIENT_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export function getClientUserId(request) {
  const c = request.cookies.get(CLIENT_COOKIE)
  const payload = verifyToken(c?.value)
  return payload?.type === 'client' ? payload.userId : null
}

// ---- Admin session ----
export function setAdminSession(res) {
  const token = signToken({ type: 'admin' })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 12, // 12h
  })
}

export function clearAdminSession(res) {
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
}

export function isAdmin(request) {
  const c = request.cookies.get(ADMIN_COOKIE)
  return verifyToken(c?.value)?.type === 'admin'
}
