// custom hook for fetching featured products - keeping the favorites section absolutely bussin
// handles loading states and all that good stuff while we fetch the real deal from vendure

import { useState, useEffect } from 'react'
import { getFeaturedProducts, formatPrice, getProductImageUrl } from '@/lib/vendure/api'
import { SearchResult } from '@/lib/vendure/types'

// Extract the type for individual search result items
type SearchResultItem = SearchResult['items'][0]

// Type for our simplified product interface that works with the existing FavoritesSection
export interface FeaturedProduct {
  id: string // Vendure product IDs are always strings, keeping it consistent
  name: string
  price: string
  href: string
  imageSrc: string
  imageAlt: string
}

export function useFeaturedProducts(limit = 3) {
  const [products, setProducts] = useState<FeaturedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        setLoading(true)
        setError(null)
        
        const result = await getFeaturedProducts(limit)
        
        // Transform Vendure search items into our simplified format
        const transformedProducts: FeaturedProduct[] = result.items.map((item: SearchResultItem) => {
          let price = 'Price unavailable'
          
          // Handle different price structures from search results
          if (item.priceWithTax) {
            if (typeof item.priceWithTax === 'number') {
              // Single price value
              price = formatPrice(item.priceWithTax, item.currencyCode)
            } else if (typeof item.priceWithTax === 'object' && 'min' in item.priceWithTax && 'max' in item.priceWithTax) {
              // Price range object
              const priceRange = item.priceWithTax as { min: number; max: number }
              if (priceRange.min === priceRange.max) {
                price = formatPrice(priceRange.min, item.currencyCode)
              } else {
                const minPrice = formatPrice(priceRange.min, item.currencyCode)
                const maxPrice = formatPrice(priceRange.max, item.currencyCode)
                price = `${minPrice} - ${maxPrice}`
              }
            }
          }

          return {
            id: item.productId,
            name: item.productName,
            price,
            href: `/shop/${item.slug}`, // Link to product detail page - fixed URL structure to match live site
            imageSrc: getProductImageUrl(item.productAsset?.preview, 'medium'),
            imageAlt: item.description || `${item.productName} - Premium trophy from Gbros`
          }
        })
        
        setProducts(transformedProducts)
      } catch (err) {
        console.error('Error fetching featured products:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch featured products')
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [limit])

  return { products, loading, error }
}
