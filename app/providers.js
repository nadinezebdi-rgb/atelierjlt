'use client'

import { CartProvider } from '@/components/site/cart-provider'
import { Toaster } from 'sonner'

export function Providers({ children }) {
  return (
    <CartProvider>
      {children}
      <Toaster position="bottom-right" theme="light" richColors={false} closeButton />
    </CartProvider>
  )
}
