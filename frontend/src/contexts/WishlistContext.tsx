// ❤️ WISHLIST CONTEXT - React context for wishlist state management
// Created: 2025-09-26 - Manages wishlist items across the entire frontend
// Features: Add/remove items, local state + server sync, toast notifications
// The emotional support system for your shopping addiction 🛍️✨

'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { graphqlClient } from '@/lib/vendure/client'
import { useAuth } from './AuthContext'
import { toast } from 'sonner'

interface WishlistItem {
  id: string
  productVariant: {
    id: string
    name: string
    sku: string
    price: number
    priceWithTax: number
    product: {
      id: string
      name: string
      slug: string
      featuredAsset?: {
        preview: string
      }
    }
  }
  addedAt: string
  notes?: string
}

interface WishlistContextValue {
  items: WishlistItem[]
  loading: boolean
  count: number
  addToWishlist: (variantId: string, notes?: string) => Promise<boolean>
  removeFromWishlist: (variantId: string) => Promise<boolean>
  isInWishlist: (variantId: string) => boolean
  clearWishlist: () => Promise<boolean>
  refreshWishlist: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const GET_WISHLIST_ITEMS = `
  query GetWishlistItems {
    wishlistItems {
      items {
        id
        productVariant {
          id
          name
          sku
          price
          priceWithTax
          product {
            id
            name
            slug
            featuredAsset {
              preview
            }
          }
        }
        addedAt
        notes
      }
      totalItems
    }
  }
`

const ADD_TO_WISHLIST = `
  mutation AddToWishlist($productVariantId: ID!, $notes: String) {
    addToWishlist(productVariantId: $productVariantId, notes: $notes) {
      id
    }
  }
`

const REMOVE_FROM_WISHLIST = `
  mutation RemoveFromWishlist($productVariantId: ID!) {
    removeFromWishlist(productVariantId: $productVariantId)
  }
`

const CLEAR_WISHLIST = `
  mutation ClearWishlist {
    clearWishlist
  }
`

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { customer } = useAuth()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [count, setCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  const fetchWishlist = useCallback(async () => {
    if (!customer) {
      setItems([])
      setCount(0)
      return
    }

    setLoading(true)
    try {
      const result = await graphqlClient.request<{ wishlistItems: { items: WishlistItem[]; totalItems: number } }>(GET_WISHLIST_ITEMS)
      setItems(result.wishlistItems.items)
      setCount(result.wishlistItems.totalItems)
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
      setItems([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [customer])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchWishlist()
    }
  }, [mounted, fetchWishlist])

  const addToWishlist = async (variantId: string, notes?: string): Promise<boolean> => {
    if (!customer) {
      toast.error('Please login to add items to wishlist')
      return false
    }

    try {
      await graphqlClient.request(ADD_TO_WISHLIST, {
        productVariantId: variantId,
        notes
      })
      await fetchWishlist()
      toast.success('Added to wishlist!')
      return true
    } catch (error) {
      console.error('Failed to add to wishlist:', error)
      toast.error('Failed to add to wishlist')
      return false
    }
  }

  const removeFromWishlist = async (variantId: string): Promise<boolean> => {
    if (!customer) return false

    try {
      await graphqlClient.request(REMOVE_FROM_WISHLIST, {
        productVariantId: variantId
      })
      await fetchWishlist()
      toast.success('Removed from wishlist')
      return true
    } catch (error) {
      console.error('Failed to remove from wishlist:', error)
      toast.error('Failed to remove from wishlist')
      return false
    }
  }

  const isInWishlist = (variantId: string): boolean => {
    return items.some(item => item.productVariant.id === variantId)
  }

  const clearWishlist = async (): Promise<boolean> => {
    if (!customer) return false

    try {
      await graphqlClient.request(CLEAR_WISHLIST)
      setItems([])
      setCount(0)
      toast.success('Wishlist cleared')
      return true
    } catch (error) {
      console.error('Failed to clear wishlist:', error)
      toast.error('Failed to clear wishlist')
      return false
    }
  }

  const value: WishlistContextValue = {
    items,
    loading,
    count,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist: fetchWishlist
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
