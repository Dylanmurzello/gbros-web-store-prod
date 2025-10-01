'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getActiveOrder,
  addItemToOrder,
  adjustOrderLine,
  removeOrderLine,
  isErrorResult,
} from '@/lib/vendure/api';
import { Order, ErrorResult } from '@/lib/vendure/types';

interface CartContextType {
  cart: Order | null;
  loading: boolean;
  error: string | null;
  addToCart: (productVariantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (orderLineId: string, quantity: number) => Promise<void>;
  removeFromCart: (orderLineId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => void; // Clear the cart after successful checkout 🧹
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fetch active order on mount
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const order = await getActiveOrder();
      setCart(order);
      setError(null);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to load cart');
      setCart(null); // Ensure cart is set even on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Only run API calls after hydration to prevent SSR/client mismatches
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      refreshCart();
    }
  }, [mounted, refreshCart]);

  const addToCart = async (productVariantId: string, quantity = 1) => {
    // UX FIX: 2025-10-01 - If order stuck in ArrangingPayment, show warning instead of failing silently 🚨
    // Customer tries to add item → Cart opens showing the yellow banner with cancel/checkout options
    if (cart?.state === 'ArrangingPayment') {
      setCartOpen(true); // Open cart to show the warning banner we added
      return; // Don't try to add item, just show them what's wrong
    }

    try {
      setError(null);
      const result = await addItemToOrder(productVariantId, quantity);

      if (isErrorResult(result)) {
        const errorResult = result as ErrorResult;
        if (errorResult.errorCode === 'INSUFFICIENT_STOCK_ERROR') {
          setError(`Only ${errorResult.quantityAvailable} items available in stock`);
        } else {
          setError(errorResult.message || 'Failed to add item to cart');
        }
        return;
      }

      setCart(result as Order);
      setCartOpen(true); // Open cart drawer when item is added
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
    }
  };

  const updateQuantity = async (orderLineId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(orderLineId);
      return;
    }

    try {
      setError(null);
      const result = await adjustOrderLine(orderLineId, quantity);

      if (isErrorResult(result)) {
        const errorResult = result as ErrorResult;
        if (errorResult.errorCode === 'INSUFFICIENT_STOCK_ERROR') {
          setError(`Only ${errorResult.quantityAvailable} items available in stock`);
        } else {
          setError(errorResult.message || 'Failed to update quantity');
        }
        return;
      }

      setCart(result as Order);
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('Failed to update quantity');
    }
  };

  const removeFromCart = async (orderLineId: string) => {
    try {
      setError(null);
      const result = await removeOrderLine(orderLineId);

      if (isErrorResult(result)) {
        setError((result as ErrorResult).message || 'Failed to remove item');
        return;
      }

      setCart(result as Order);
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
    }
  };

  // Clear cart after successful checkout - no more ghost items haunting you 👻
  const clearCart = () => {
    setCart(null);
    setCartOpen(false);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        refreshCart,
        clearCart,
        cartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
