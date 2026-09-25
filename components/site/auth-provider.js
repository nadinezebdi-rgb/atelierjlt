'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      const d = await r.json()
      setUser(d.user || null)
    } catch { setUser(null) }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const login = useCallback(async (email, password) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const d = await r.json()
    if (r.ok) setUser(d.user)
    return { ok: r.ok, error: d.error }
  }, [])

  const register = useCallback(async (email, password, name) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const d = await r.json()
    if (r.ok) setUser(d.user)
    return { ok: r.ok, error: d.error }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
