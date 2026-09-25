'use client'

import { CartProvider } from '@/components/site/cart-provider'
import { AuthProvider } from '@/components/site/auth-provider'
import { Toaster } from 'sonner'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <Toaster position="bottom-right" theme="light" richColors={false} closeButton />
      </CartProvider>
    </AuthProvider>
  )
}
