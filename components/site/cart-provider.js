'use client'

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

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/cart', { cache: 'no-store', credentials: 'include' })
      const d = await r.json()
      setItems(d.items || [])
    } catch (e) { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const add = useCallback(async (slug, qty = 1) => {
    const r = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug, qty }),
    })
    const d = await r.json()
    setItems(d.items || [])
    setOpen(true)
    return d
  }, [])

  const update = useCallback(async (slug, qty) => {
    const r = await fetch('/api/cart', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ slug, qty }),
    })
    const d = await r.json()
    setItems(d.items || [])
  }, [])

  const remove = useCallback(async (slug) => {
    const r = await fetch('/api/cart?slug=' + encodeURIComponent(slug), {
      method: 'DELETE',
      credentials: 'include',
    })
    const d = await r.json()
    setItems(d.items || [])
  }, [])

  const count = items.reduce((s, i) => s + i.qty, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, count, subtotal, open, setOpen, add, update, remove, loading, refresh }}>
      {children}
    </CartContext.Provider>
  )
}
