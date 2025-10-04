'use client'
import { Fragment, useState, useEffect, useCallback } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import Link from 'next/link'
import { graphqlClient } from '@/lib/vendure/client'
import { SEARCH_PRODUCTS } from '@/lib/vendure/queries'

// Search modal that actually uses that beautiful Elasticsearch we just set up 🔍
// This is where all that infrastructure work FINALLY shows up for users fr fr

interface SearchProduct {
  productId: string
  productName: string
  slug: string
  description: string
  productAsset?: {
    preview: string
  }
  priceWithTax: {
    value?: number
    min?: number
    max?: number
  }
  currencyCode: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)

  // Debounced search - don't spam ES on every keystroke like a noob
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        performSearch(searchTerm)
      } else {
        setResults([])
        setTotalItems(0)
      }
    }, 300) // Wait 300ms after user stops typing - sweet spot

    return () => clearTimeout(timer)
  }, [searchTerm])

  // THIS is where Elasticsearch shines - instant text search! ⚡
  const performSearch = async (term: string) => {
    try {
      setLoading(true)
      const result = await graphqlClient.request<{
        search: {
          totalItems: number
          items: SearchProduct[]
        }
      }>(SEARCH_PRODUCTS, {
        input: {
          term: term.trim(), // The magic term that searches across product names/descriptions
          take: 8, // Show top 8 results
          groupByProduct: true,
        }
      })

      setResults(result.search.items)
      setTotalItems(result.search.totalItems)
    } catch (error) {
      console.error('Search failed (ES might be down?):', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  // Format price - handles both single price and price ranges
  const formatPrice = (price: SearchProduct['priceWithTax'], currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    })

    if ('value' in price && price.value) {
      return formatter.format(price.value / 100)
    } else if ('min' in price && 'max' in price && price.min !== undefined && price.max !== undefined) {
      return `${formatter.format(price.min / 100)} - ${formatter.format(price.max / 100)}`
    }
    return 'Price unavailable'
  }

  // Close modal and reset on Escape or backdrop click
  const handleClose = useCallback(() => {
    setSearchTerm('')
    setResults([])
    onClose()
  }, [onClose])

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop - that sweet dimmed background */}
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        {/* Modal positioning */}
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
          <DialogPanel
            transition
            className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          >
            {/* Search input header */}
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                type="text"
                className="h-12 w-full border-0 bg-transparent pl-11 pr-11 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search for trophies, medals, awards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <button
                onClick={handleClose}
                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Search results - where the magic happens ✨ */}
            {searchTerm.trim().length >= 2 && (
              <div className="max-h-96 overflow-y-auto py-4 px-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                      <p className="text-sm text-gray-500">Searching with Elasticsearch...</p>
                    </div>
                  </div>
                ) : results.length > 0 ? (
                  <>
                    {/* Results count - flex that ES speed 💪 */}
                    <p className="text-xs text-gray-500 mb-3">
                      Found {totalItems} {totalItems === 1 ? 'result' : 'results'}
                      {totalItems > 8 && ' (showing top 8)'}
                    </p>
                    <ul className="space-y-3">
                      {results.map((product) => (
                        <li key={product.productId}>
                          <Link
                            href={`/shop/${product.slug}`}
                            onClick={handleClose}
                            className="group flex items-center gap-4 rounded-lg p-3 border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all"
                          >
                            {/* Product image */}
                            {product.productAsset?.preview ? (
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                                <Image
                                  src={product.productAsset.preview}
                                  alt={product.productName}
                                  fill
                                  className="object-cover object-center group-hover:opacity-75"
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 flex-shrink-0 rounded-md border border-gray-200 bg-gray-200" />
                            )}
                            
                            {/* Product info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {product.productName}
                              </p>
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {product.description || 'No description available'}
                              </p>
                            </div>

                            {/* Price */}
                            <div className="flex-shrink-0 text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatPrice(product.priceWithTax, product.currencyCode)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {/* View all results link if there's more */}
                    {totalItems > 8 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Link
                          href={`/shop?search=${encodeURIComponent(searchTerm)}`}
                          onClick={handleClose}
                          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          View all {totalItems} results
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">
                      No products found for &ldquo;{searchTerm}&rdquo;
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try different keywords or browse our categories
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Empty state - show when no search term */}
            {searchTerm.trim().length < 2 && !loading && (
              <div className="py-14 px-6 text-center text-sm sm:px-14">
                <MagnifyingGlassIcon
                  className="mx-auto h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
                <p className="mt-4 font-semibold text-gray-900">Search our products</p>
                <p className="mt-2 text-gray-500">
                  Find trophies, medals, and awards using our lightning-fast search
                </p>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>
    </Transition>
  )
}

