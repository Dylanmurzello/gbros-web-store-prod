'use client'
import Image from 'next/image'

import { useState, useEffect } from 'react'
import NavigationHeader from '@/components/NavigationHeader'
import MobileMenu from '@/components/MobileMenu'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { navigation, footerNavigation } from '@/data/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GET_CUSTOMER_ORDERS } from '@/lib/vendure/queries/order'
import { graphqlClient } from '@/lib/vendure/client'

interface OrderLine {
  id: string
  quantity: number
  unitPriceWithTax: number
  linePriceWithTax: number
  productVariant: {
    id: string
    name: string
    sku: string
    priceWithTax: number
    product: {
      id: string
      name: string
      slug: string
      featuredAsset?: {
        preview: string
      }
    }
    featuredAsset?: {
      preview: string
    }
    options: Array<{
      name: string
      group: {
        name: string
      }
    }>
  }
}

interface Order {
  id: string
  code: string
  state: string
  totalWithTax: number
  createdAt: string
  updatedAt: string
  lines: OrderLine[]
}

export default function OrderHistoryPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 5
  const { customer } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!customer) {
      router.push('/login?redirect=/orders')
    }
  }, [customer, router])

  // Fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer) return

      setLoading(true)
      setError(null)

      try {
        const data = await graphqlClient.request(GET_CUSTOMER_ORDERS) as { activeCustomer?: { orders?: { items?: Order[] } } }

        if (data?.activeCustomer?.orders?.items) {
          setOrders(data.activeCustomer.orders.items)
        } else {
          setOrders([])
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
        setError('Failed to load orders. Please try again later.')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [customer])

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / ordersPerPage)
  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Please sign in</h2>
          <p className="mt-2 text-gray-600">You need to be signed in to view your orders.</p>
          <Link
            href="/login?redirect=/orders"
            className="mt-4 inline-block rounded-md bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* Mobile menu */}
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />

      {/* Cart drawer */}
      <CartDrawer />

      <header className="relative">
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:pt-24 sm:pb-32 lg:px-8">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Your Orders</h1>
          <p className="mt-2 text-sm text-gray-500">
            Check the status of recent orders, manage returns, and discover similar products.
          </p>
        </div>

        {loading ? (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          </div>
        ) : error ? (
          <div className="mt-12 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by placing your first order.</p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-12 space-y-16 sm:mt-16">
            {currentOrders.map((order) => {
              const orderDate = new Date(order.createdAt)
              const formattedDate = orderDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              const orderStatus = order.state.charAt(0).toUpperCase() + order.state.slice(1).toLowerCase().replace('_', ' ')

              return (
                <section key={order.code} aria-labelledby={`${order.code}-heading`}>
                  <div className="space-y-1 md:flex md:items-baseline md:space-y-0 md:space-x-4">
                    <h2 id={`${order.code}-heading`} className="text-lg font-medium text-gray-900 md:shrink-0">
                      Order #{order.code}
                    </h2>
                    <div className="space-y-5 sm:flex sm:items-baseline sm:justify-between sm:space-y-0 md:min-w-0 md:flex-1">
                      <p className="text-sm font-medium text-gray-500">
                        {orderStatus} • {formattedDate}
                      </p>
                      <div className="flex text-sm font-medium">
                        <Link href={`/orders/${order.code}`} className="text-indigo-600 hover:text-indigo-500">
                          View details
                        </Link>
                        <div className="ml-4 border-l border-gray-200 pl-4 sm:ml-6 sm:pl-6">
                          <span className="text-gray-900">
                            Total: ${(order.totalWithTax / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 -mb-6 flow-root divide-y divide-gray-200 border-t border-gray-200">
                    {order.lines.map((line) => {
                      const imageUrl = line.productVariant.featuredAsset?.preview ||
                                      line.productVariant.product.featuredAsset?.preview ||
                                      '/images/placeholder.png'

                      const productOptions = line.productVariant.options
                        .map(opt => `${opt.group.name}: ${opt.name}`)
                        .join(' • ')

                      return (
                        <div key={line.id} className="py-6 sm:flex">
                          <div className="flex space-x-4 sm:min-w-0 sm:flex-1 sm:space-x-6 lg:space-x-8">
                            <Image
                width={400}
                height={400}
                              alt={line.productVariant.name}
                              src={imageUrl}
                              className="size-20 flex-none rounded-md object-cover sm:size-48"
                            />
                            <div className="min-w-0 flex-1 pt-1.5 sm:pt-0">
                              <h3 className="text-sm font-medium text-gray-900">
                                <Link href={`/products/${line.productVariant.product.slug}`}>
                                  {line.productVariant.product.name}
                                </Link>
                              </h3>
                              {productOptions && (
                                <p className="truncate text-sm text-gray-500 mt-1">
                                  {productOptions}
                                </p>
                              )}
                              <p className="mt-1 text-sm text-gray-500">
                                Quantity: {line.quantity}
                              </p>
                              <p className="mt-1 font-medium text-gray-900">
                                ${(line.linePriceWithTax / 100).toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-6 space-y-4 sm:mt-0 sm:ml-6 sm:w-40 sm:flex-none">
                            <Link
                              href={`/products/${line.productVariant.product.slug}`}
                              className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-2.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden sm:grow-0"
                            >
                              Buy again
                            </Link>
                            <Link
                              href="/shop"
                              className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden sm:grow-0"
                            >
                              Shop similar
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && orders.length > ordersPerPage && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-0">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstOrder + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastOrder, orders.length)}
                  </span>{' '}
                  of <span className="font-medium">{orders.length}</span> orders
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1
                    const isCurrentPage = pageNumber === currentPage

                    // Show first page, last page, current page, and adjacent pages
                    const shouldShow =
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      Math.abs(pageNumber - currentPage) <= 1

                    const showEllipsis =
                      pageNumber === 2 && currentPage > 3 ||
                      pageNumber === totalPages - 1 && currentPage < totalPages - 2

                    if (!shouldShow && !showEllipsis) return null

                    if (showEllipsis && pageNumber === 2) {
                      return (
                        <span key={`ellipsis-start`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                          ...
                        </span>
                      )
                    }

                    if (showEllipsis && pageNumber === totalPages - 1) {
                      return (
                        <span key={`ellipsis-end`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                          ...
                        </span>
                      )
                    }

                    return shouldShow ? (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          isCurrentPage
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ) : null
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer navigation={footerNavigation} />
    </div>
  )
}