'use client';

// ARCHITECTURE FIX: 2025-09-30 - Client-side layout wrapper with error boundaries 🛡️
// Separates client logic from server layout for proper Next.js 15 architecture

import { ReactNode } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import ErrorBoundary from './ErrorBoundary';

interface ClientLayoutProps {
  children: ReactNode;
  googleClientId: string;
}

export default function ClientLayout({ children, googleClientId }: ClientLayoutProps) {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <WishlistProvider>
            <CartProvider>
              <Toaster richColors position="top-right" />
              {children}
            </CartProvider>
          </WishlistProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
