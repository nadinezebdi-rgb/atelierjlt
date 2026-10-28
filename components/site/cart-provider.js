'use client'

import { toast } from 'sonner'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  // null = inconnu (chargement), false = ventes fermées
  const [salesOpen, setSalesOpen] = useState(null)
  useEffect(() => {
    fetch('/api/shop/status', { cache: 'no-store' }).then((r) => r.json()).then((d) => setSalesOpen(!!d.salesOpen)).catch(() => setSalesOpen(false))
  }, [])

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/cart', { cache: 'no-store', credentials: 'include' })
      const d = await r.json()
      setItems(d.items || [])
    } catch (e) { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (slug, qty = 1, extra = {}) => {
    const r = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug, qty, ...extra }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      toast.error(d.error || 'Ajout impossible pour le moment')
      return d
    }
    setItems(d.items || [])
    setOpen(true)
    return d
  }, [])

  const update = useCallback(async (slug, qty, extra = {}) => {
    const r = await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug, qty, ...extra }),
    })
    const d = await r.json()
    setItems(d.items || [])
  }, [])

  const remove = useCallback(async (slug, extra = {}) => {
    const params = new URLSearchParams({ slug })
    if (extra.variant) params.set('variant', extra.variant)
    if (extra.size) params.set('size', extra.size)
    const r = await fetch('/api/cart?' + params.toString(), {
      method: 'DELETE',
      credentials: 'include',
    })
    const d = await r.json()
    setItems(d.items || [])
  }, [])

  const count = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, count, subtotal, open: open && salesOpen === true, setOpen, add, update, remove, loading, refresh, salesOpen }}>
      {children}
    </CartContext.Provider>
  )
}
