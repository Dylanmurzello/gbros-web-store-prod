'use client'
import Image from 'next/image'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ChevronDownIcon, PlusIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import NavigationHeader from '@/components/NavigationHeader'
import Footer from '@/components/Footer'
import MobileMenu from '@/components/MobileMenu'
import { graphqlClient } from '@/lib/vendure/client'
import { SEARCH_PRODUCTS } from '@/lib/vendure/queries'
import { getProductImageUrl } from '@/lib/vendure/api'
import { navigation, footerNavigation } from '@/data/navigation'

// yo these interfaces keep things typed and not janky fr fr

interface Product {
  productId: string
  productName: string
  slug: string
  description: string
  productAsset?: {
    id: string
    preview: string
  }
  priceWithTax: {
    value?: number
    min?: number
    max?: number
  }
  currencyCode: string
  facetValueIds: string[]
  collectionIds: string[]
}

interface FacetValueResult {
  count: number
  facetValue: {
    id: string
    code: string
    name: string
    facet: {
      id: string
      code: string
      name: string
    }
  }
}

interface SearchResult {
  search: {
    totalItems: number
    items: Product[]
    facetValues: FacetValueResult[]
  }
}

// Dynamic filter structure - categories loaded from Vendure! 🎯
// No more hardcoded bs, we got real data now fr fr
interface FilterOption {
  value: string // facetValueId
  label: string // display name
  count: number // product count
}

interface Filter {
  id: string
  name: string
  options: FilterOption[]
}

export default function ShopPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filter[]>([]) // Dynamic filters from Vendure 🔥
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const productsPerPage = 12

  // Load categories on mount 🎯
  useEffect(() => {
    fetchCategories()
  }, [])

  // fetch that product data like we're on a mission 🚀
  useEffect(() => {
    fetchProducts()
  }, [currentPage, selectedFilters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch category facets from Vendure (dynamic filters baby!) 🔥
  const fetchCategories = async () => {
    try {
      const query = `
        query GetCategoryFacets {
          facets {
            items {
              id
              code
              name
              values {
                id
                code
                name
              }
            }
          }
        }
      `
      
      interface FacetValue {
        id: string
        code: string
        name: string
      }
      
      interface Facet {
        id: string
        code: string
        name: string
        values: FacetValue[]
      }
      
      interface FacetsResult {
        facets: {
          items: Facet[]
        }
      }
      
      const result = await graphqlClient.request<FacetsResult>(query)
      
      // Find the category facet and build filter options
      const categoryFacet = result.facets.items.find((f) => f.code === 'category')
      
      if (categoryFacet) {
        // Fetch product counts for each category
        const categoryOptions = await Promise.all(
          categoryFacet.values.map(async (val) => {
            const countResult = await graphqlClient.request<SearchResult>(SEARCH_PRODUCTS, {
              input: {
                facetValueIds: [val.id],
                take: 0,
                groupByProduct: true
              }
            })
            return {
              value: val.id,
              label: val.name,
              count: countResult.search.totalItems
            }
          })
        )
        
        // Sort by product count (most popular first)
        categoryOptions.sort((a, b) => b.count - a.count)
        
        setFilters([{
          id: 'category',
          name: 'Category',
          options: categoryOptions
        }])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // No categories? No problem, filters just won't show 🤷
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const skip = (currentPage - 1) * productsPerPage
      
      // build the facet filter values from selected filters
      const facetValueFilters = Object.entries(selectedFilters)
        .flatMap(([, values]) => values)
        .filter(Boolean)

      const result = await graphqlClient.request<SearchResult>(SEARCH_PRODUCTS, {
        input: {
          take: productsPerPage,
          skip,
          groupByProduct: true,
          ...(facetValueFilters.length > 0 && {
            facetValueIds: facetValueFilters
          })
        }
      })

      setProducts(result.search.items)
      setTotalProducts(result.search.totalItems)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // just vibing with empty products if it fails, no stress
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // handle filter changes like a boss 💪
  const handleFilterChange = (filterId: string, value: string, checked: boolean) => {
    setSelectedFilters(prev => {
      const newFilters = { ...prev }
      if (!newFilters[filterId]) {
        newFilters[filterId] = []
      }
      
      if (checked) {
        newFilters[filterId] = [...newFilters[filterId], value]
      } else {
        newFilters[filterId] = newFilters[filterId].filter(v => v !== value)
      }
      
      if (newFilters[filterId].length === 0) {
        delete newFilters[filterId]
      }
      
      return newFilters
    })
    setCurrentPage(1) // reset to first page when filters change
  }

  // format that price like we got money to spend 💰
  const formatPrice = (price: { value?: number; min?: number; max?: number }, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    })
    
    // single price check first, most common case
    if (price.value !== undefined) {
      return formatter.format(price.value / 100)
    }
    
    // price range check
    if (price.min !== undefined && price.max !== undefined) {
      if (price.min === price.max) {
        return formatter.format(price.min / 100)
      }
      return `${formatter.format(price.min / 100)} - ${formatter.format(price.max / 100)}`
    }
    
    // fallback if we somehow got here
    if (price.min !== undefined) {
      return formatter.format(price.min / 100)
    }
    
    return formatter.format(0)
  }

  const totalPages = Math.ceil(totalProducts / productsPerPage)

  return (
    <div className="bg-white">
      {/* Mobile menu that slides like butter when you need it */}
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
      
      <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />

      <div>
        {/* Mobile filter dialog - slides out like a sneaky boi */}
        <Dialog open={mobileFiltersOpen} onClose={setMobileFiltersOpen} className="relative z-40 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 z-40 flex">
            <DialogPanel
              transition
              className="relative ml-auto flex size-full max-w-xs transform flex-col overflow-y-auto bg-white pt-4 pb-6 shadow-xl transition duration-300 ease-in-out data-closed:translate-x-full"
            >
              <div className="flex items-center justify-between px-4">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="relative -mr-2 flex size-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon aria-hidden="true" className="size-6" />
                </button>
              </div>

              {/* Mobile Filters */}
              <form className="mt-4">
                {filters.map((section) => (
                  <Disclosure key={section.name} as="div" className="border-t border-gray-200 pt-4 pb-4">
                    <fieldset>
                      <legend className="w-full px-2">
                        <DisclosureButton className="group flex w-full items-center justify-between p-2 text-gray-400 hover:text-gray-500">
                          <span className="text-sm font-medium text-gray-900">{section.name}</span>
                          <span className="ml-6 flex h-7 items-center">
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="size-5 rotate-0 transform group-data-open:-rotate-180"
                            />
                          </span>
                        </DisclosureButton>
                      </legend>
                      <DisclosurePanel className="px-4 pt-4 pb-2">
                        <div className="space-y-6">
                          {section.options.map((option, optionIdx) => (
                            <div key={option.value} className="flex gap-3">
                              <div className="flex h-5 shrink-0 items-center">
                                <div className="group grid size-4 grid-cols-1">
                                  <input
                                    defaultValue={option.value}
                                    id={`${section.id}-${optionIdx}-mobile`}
                                    name={`${section.id}[]`}
                                    type="checkbox"
                                    checked={selectedFilters[section.id]?.includes(option.value) || false}
                                    onChange={(e) => handleFilterChange(section.id, option.value, e.target.checked)}
                                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                  />
                                  <svg
                                    fill="none"
                                    viewBox="0 0 14 14"
                                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                  >
                                    <path
                                      d="M3 8L6 11L11 3.5"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="opacity-0 group-has-checked:opacity-100"
                                    />
                                    <path
                                      d="M3 7H11"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="opacity-0 group-has-indeterminate:opacity-100"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <label htmlFor={`${section.id}-${optionIdx}-mobile`} className="text-sm text-gray-500 flex-1">
                                {option.label}
                              </label>
                              <span className="text-xs text-gray-400 ml-2">({option.count})</span>
                            </div>
                          ))}
                        </div>
                      </DisclosurePanel>
                    </fieldset>
                  </Disclosure>
                ))}
              </form>
            </DialogPanel>
          </div>
        </Dialog>

        {/* breadcrumbs be breadcrumbing */}
        <div className="border-b border-gray-200">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ol role="list" className="flex items-center space-x-4 py-4">
              <li>
                <div className="flex items-center">
                  <Link href="/" className="mr-4 text-sm font-medium text-gray-900">
                    Home
                  </Link>
                  <svg viewBox="0 0 6 20" aria-hidden="true" className="h-5 w-auto text-gray-300">
                    <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor" />
                  </svg>
                </div>
              </li>
              <li className="text-sm">
                <a href="#" aria-current="page" className="font-medium text-gray-500 hover:text-gray-600">
                  All Awards
                </a>
              </li>
            </ol>
          </nav>
        </div>

        <main className="mx-auto max-w-2xl px-4 lg:max-w-7xl lg:px-8">
          <div className="border-b border-gray-200 pt-24 pb-10">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Awards & Trophies</h1>
            <p className="mt-4 text-base text-gray-500">
              Premium awards and trophies for every achievement. Custom engraving available on all products!
            </p>
          </div>

          <div className="pt-12 pb-24 lg:grid lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
            <aside>
              <h2 className="sr-only">Filters</h2>

              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="inline-flex items-center lg:hidden"
              >
                <span className="text-sm font-medium text-gray-700">Filters</span>
                <PlusIcon aria-hidden="true" className="ml-1 size-5 shrink-0 text-gray-400" />
              </button>

              {/* Desktop filters - staying put like a good boi */}
              <div className="hidden lg:block">
                <form className="divide-y divide-gray-200">
                  {filters.map((section) => (
                    <div key={section.name} className="py-10 first:pt-0 last:pb-0">
                      <fieldset>
                        <legend className="block text-sm font-medium text-gray-900">{section.name}</legend>
                        <div className="space-y-3 pt-6">
                          {section.options.map((option, optionIdx) => (
                            <div key={option.value} className="flex gap-3">
                              <div className="flex h-5 shrink-0 items-center">
                                <div className="group grid size-4 grid-cols-1">
                                  <input
                                    defaultValue={option.value}
                                    id={`${section.id}-${optionIdx}`}
                                    name={`${section.id}[]`}
                                    type="checkbox"
                                    checked={selectedFilters[section.id]?.includes(option.value) || false}
                                    onChange={(e) => handleFilterChange(section.id, option.value, e.target.checked)}
                                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                  />
                                  <svg
                                    fill="none"
                                    viewBox="0 0 14 14"
                                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                  >
                                    <path
                                      d="M3 8L6 11L11 3.5"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="opacity-0 group-has-checked:opacity-100"
                                    />
                                    <path
                                      d="M3 7H11"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="opacity-0 group-has-indeterminate:opacity-100"
                                    />
                                  </svg>
                                </div>
                              </div>
                              <label htmlFor={`${section.id}-${optionIdx}`} className="text-sm text-gray-600 flex-1">
                                {option.label}
                              </label>
                              <span className="text-xs text-gray-400 ml-2">({option.count})</span>
                            </div>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  ))}
                </form>
              </div>
            </aside>

            {/* Products grid - where the magic happens ✨ */}
            <section aria-labelledby="product-heading" className="mt-6 lg:col-span-2 lg:mt-0 xl:col-span-3">
              <h2 id="product-heading" className="sr-only">
                Products
              </h2>

              {loading ? (
                // loading state looking cute might delete later
                <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 xl:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-3/4 bg-gray-200 rounded-lg" />
                      <div className="mt-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded" />
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                // no products found, tragic fr 😔
                <div className="text-center py-12">
                  <p className="text-gray-500">No products found. Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:gap-x-8 xl:grid-cols-3">
                    {/* FIXED: 2025-09-26 - Enhanced key with slug + index for better uniqueness */}
                    {products.map((product, index) => (
                      <div
                        key={`${product.productId}-${product.slug || index}`}
                        className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
                      >
                        {product.productAsset?.preview ? (
                          <Image
                width={400}
                height={400}
                            alt={product.productName}
                            src={getProductImageUrl(product.productAsset.preview, 'medium')}
                            loading="lazy"
                            className="aspect-3/4 bg-gray-200 object-cover group-hover:opacity-75 sm:h-96"
                          />
                        ) : (
                          // placeholder when no image, keeping it classy
                          <div className="aspect-3/4 bg-gray-200 flex items-center justify-center sm:h-96">
                            <span className="text-gray-400">No image</span>
                          </div>
                        )}
                        <div className="flex flex-1 flex-col space-y-2 p-4">
                          <h3 className="text-sm font-medium text-gray-900">
                            <a href={`/shop/${product.slug}`}>
                              <span aria-hidden="true" className="absolute inset-0" />
                              {product.productName}
                            </a>
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                          <div className="flex flex-1 flex-col justify-end">
                            <p className="text-base font-medium text-gray-900">
                              {formatPrice(product.priceWithTax, product.currencyCode)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination - helping you navigate this product ocean 🌊 */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center">
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronDownIcon className="h-5 w-5 rotate-90" aria-hidden="true" />
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => {
                          const page = i + 1
                          // show first, last, current and adjacent pages
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                                  page === currentPage
                                    ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700">...</span>
                          }
                          return null
                        })}
                        
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                        >
                          <span className="sr-only">Next</span>
                          <ChevronDownIcon className="h-5 w-5 -rotate-90" aria-hidden="true" />
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </main>
      </div>

      <Footer navigation={footerNavigation} />
    </div>
  )
}
