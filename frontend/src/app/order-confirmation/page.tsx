'use client'
import Image from 'next/image'

// BRUH this order success page is about to be ABSOLUTELY STUNNING 🔥💯
// We're replacing that basic ass page with some premium vibes
// Template design meets live Vendure data = *chef's kiss*

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
// Removed unused imports since we're using consistent components now
import NavigationHeader from '@/components/NavigationHeader'
import Footer from '@/components/Footer'
import MobileMenu from '@/components/MobileMenu'
import CartDrawer from '@/components/CartDrawer'
import { navigation, footerNavigation } from '@/data/navigation'
import { getOrderByCode, formatPrice, getProductImageUrl } from '@/lib/vendure/api'
import { Order } from '@/lib/vendure/types'

// Utility function for CSS classes
function classNames(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// This is going to be clean AF 🧈
function OrderConfirmationContent({ orderCode }: { orderCode: string | null }) {
  const router = useRouter()
  // Removed unused template mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false) // Our existing mobile menu
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load order data when component mounts - this is where the magic happens ✨
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderCode) {
        setError('No order code provided. Something went wrong during checkout.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const orderData = await getOrderByCode(orderCode)
        
        if (!orderData) {
          setError('Order not found. Please check your order confirmation email.')
          return
        }

        setOrder(orderData)
      } catch (err) {
        console.error('Error loading order:', err)
        setError('Failed to load order details. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderCode])

  // Helper function to get order status step - making it dynamic AF
  const getOrderStep = (state: string): number => {
    switch (state) {
      case 'PaymentSettled':
      case 'PaymentAuthorized':
        return 0 // Order placed
      case 'Fulfillment':
      case 'PartiallyFulfilled':
        return 1 // Processing
      case 'Shipped':
      case 'PartiallyShipped':
        return 2 // Shipped
      case 'Delivered':
        return 3 // Delivered
      default:
        return 0
    }
  }

  // Loading state - keeping it clean
  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
        <CartDrawer />
        <header className="relative overflow-hidden">
          <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </main>
        <Footer navigation={footerNavigation} />
      </div>
    )
  }

  // Error state - gotta handle the fails gracefully
  if (error) {
    return (
      <div className="bg-white min-h-screen">
        <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
        <CartDrawer />
        <header className="relative overflow-hidden">
          <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-4">Oops!</h1>
            <p className="text-lg text-red-600 mb-8">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </main>
        <Footer navigation={footerNavigation} />
      </div>
    )
  }

  if (!order) return null

  // Get the current step based on order state
  const currentStep = getOrderStep(order.state)

  return (
    <div className="bg-white min-h-screen">
      {/* Using consistent components like other pages */}
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
      <CartDrawer />
      
      {/* Consistent header structure */}
      <header className="relative overflow-hidden">
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Details</h1>

        <div className="mt-2 border-b border-gray-200 pb-5 text-sm sm:flex sm:justify-between">
          <dl className="flex">
            <dt className="text-gray-500">Order number&nbsp;</dt>
            <dd className="font-medium text-gray-900">{order.code}</dd>
            <dt>
              <span className="sr-only">Date</span>
              <span aria-hidden="true" className="mx-2 text-gray-400">
                &middot;
              </span>
            </dt>
            <dd className="font-medium text-gray-900">
              <time dateTime={order.orderPlacedAt || new Date().toISOString()}>
                {new Date(order.orderPlacedAt || new Date()).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </dd>
          </dl>
          <div className="mt-4 sm:mt-0">
            <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
              View invoice
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </div>

        <section aria-labelledby="products-heading" className="mt-8">
          <h2 id="products-heading" className="sr-only">
            Products purchased
          </h2>

          <div className="space-y-24">
            {order.lines.map((line) => (
              <div
                key={line.id}
                className="grid grid-cols-1 text-sm sm:grid-cols-12 sm:grid-rows-1 sm:gap-x-6 md:gap-x-8 lg:gap-x-8"
              >
                <div className="sm:col-span-4 md:col-span-5 md:row-span-2 md:row-end-2">
                  <Image
                width={400}
                height={400}
                    alt={line.productVariant.product.name}
                    src={getProductImageUrl(line.featuredAsset?.preview, 'medium')}
                    className="aspect-square w-full rounded-lg bg-gray-50 object-cover"
                  />
                </div>
                <div className="mt-6 sm:col-span-7 sm:mt-0 md:row-end-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    <a href={`/shop/${line.productVariant.product.slug}`}>
                      {line.productVariant.product.name}
                    </a>
                  </h3>
                  <p className="mt-1 font-medium text-gray-900">
                    {formatPrice(line.linePriceWithTax, order.currencyCode)}
                  </p>
                  <p className="mt-3 text-gray-500">SKU: {line.productVariant.sku} | Qty: {line.quantity}</p>
                </div>
                <div className="sm:col-span-12 md:col-span-7">
                  <dl className="grid grid-cols-1 gap-y-8 border-b border-gray-200 py-8 sm:grid-cols-2 sm:gap-x-6 sm:py-6 md:py-10">
                    <div>
                      <dt className="font-medium text-gray-900">Delivery address</dt>
                      <dd className="mt-3 text-gray-500">
                        {order.shippingAddress && (
                          <>
                            <span className="block">{order.shippingAddress.fullName}</span>
                            <span className="block">{order.shippingAddress.streetLine1}</span>
                            {order.shippingAddress.streetLine2 && (
                              <span className="block">{order.shippingAddress.streetLine2}</span>
                            )}
                            <span className="block">
                              {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                            </span>
                            <span className="block">{order.shippingAddress.country?.name}</span>
                          </>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-900">Shipping updates</dt>
                      <dd className="mt-3 space-y-3 text-gray-500">
                        {order.customer && (
                          <>
                            <p>{order.customer.emailAddress}</p>
                            {(order.shippingAddress as { phoneNumber?: string })?.phoneNumber && <p>{(order.shippingAddress as { phoneNumber?: string }).phoneNumber}</p>}
                          </>
                        )}
                        <button type="button" className="font-medium text-indigo-600 hover:text-indigo-500">
                          Edit
                        </button>
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-6 font-medium text-gray-900 md:mt-10">
                    {order.state} on{' '}
                    <time dateTime={order.orderPlacedAt || new Date().toISOString()}>
                      {new Date(order.orderPlacedAt || new Date()).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </p>
                  <div className="mt-6">
                    <div className="overflow-hidden rounded-full bg-gray-200">
                      <div
                        style={{ width: `calc((${currentStep} * 2 + 1) / 8 * 100%)` }}
                        className="h-2 rounded-full bg-indigo-600"
                      />
                    </div>
                    <div className="mt-6 hidden grid-cols-4 font-medium text-gray-600 sm:grid">
                      <div className="text-indigo-600">Order placed</div>
                      <div className={classNames(currentStep > 0 ? 'text-indigo-600' : '', 'text-center')}>
                        Processing
                      </div>
                      <div className={classNames(currentStep > 1 ? 'text-indigo-600' : '', 'text-center')}>
                        Shipped
                      </div>
                      <div className={classNames(currentStep > 2 ? 'text-indigo-600' : '', 'text-right')}>
                        Delivered
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Billing Summary */}
        <section aria-labelledby="summary-heading" className="mt-24">
          <h2 id="summary-heading" className="sr-only">
            Billing Summary
          </h2>

          <div className="rounded-lg bg-gray-50 px-6 py-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:px-0 lg:py-8">
            <dl className="grid grid-cols-1 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-5 lg:pl-8">
              <div>
                <dt className="font-medium text-gray-900">Billing address</dt>
                <dd className="mt-3 text-gray-500">
                  {order.billingAddress && (
                    <>
                      <span className="block">{order.billingAddress.fullName}</span>
                      <span className="block">{order.billingAddress.streetLine1}</span>
                      {order.billingAddress.streetLine2 && (
                        <span className="block">{order.billingAddress.streetLine2}</span>
                      )}
                      <span className="block">
                        {order.billingAddress.city}, {order.billingAddress.province} {order.billingAddress.postalCode}
                      </span>
                      <span className="block">{order.billingAddress.country?.name}</span>
                    </>
                  )}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Payment information</dt>
                <dd className="mt-3 flex">
                  <div>
                    <svg width={36} height={24} viewBox="0 0 36 24" aria-hidden="true" className="h-6 w-auto">
                      <rect rx={4} fill="#224DBA" width={36} height={24} />
                      <path
                        d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z"
                        fill="#fff"
                      />
                    </svg>
                    <p className="sr-only">Visa</p>
                  </div>
                  <div className="ml-4">
                    {order.payments && order.payments.length > 0 && (
                      <>
                        <p className="text-gray-900">Payment successful</p>
                        <p className="text-gray-600">
                          {formatPrice(order.payments[0].amount, order.currencyCode)}
                        </p>
                      </>
                    )}
                  </div>
                </dd>
              </div>
            </dl>

            <dl className="mt-8 divide-y divide-gray-200 text-sm lg:col-span-7 lg:mt-0 lg:pr-8">
              <div className="flex items-center justify-between pb-4">
                <dt className="text-gray-600">Subtotal</dt>
                <dd className="font-medium text-gray-900">
                  {formatPrice(order.subTotalWithTax, order.currencyCode)}
                </dd>
              </div>
              <div className="flex items-center justify-between py-4">
                <dt className="text-gray-600">Shipping</dt>
                <dd className="font-medium text-gray-900">
                  {formatPrice(order.shippingWithTax, order.currencyCode)}
                </dd>
              </div>
              <div className="flex items-center justify-between pt-4">
                <dt className="font-medium text-gray-900">Order total</dt>
                <dd className="font-medium text-indigo-600">
                  {formatPrice(order.totalWithTax, order.currencyCode)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="mt-16 flex flex-col sm:flex-row gap-4 max-w-md">
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => router.push('/shop')}
            className="flex-1 bg-white text-indigo-600 px-6 py-3 rounded-md font-medium border border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            View All Products
          </button>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔒 Your payment information is secure and encrypted</p>
          <p className="mt-1">🚚 Free shipping on orders over $75 | 🎖️ Free engraving included</p>
        </div>
      </main>

      {/* Consistent footer */}
      <Footer navigation={footerNavigation} />
    </div>
  )
}

// Wrapper component that extracts search params
function OrderConfirmationWrapper() {
  const [orderCode, setOrderCode] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Get order code from URL on client side
    const params = new URLSearchParams(window.location.search)
    setOrderCode(params.get('order'))
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">Loading order details...</div>
      </div>
    )
  }

  return <OrderConfirmationContent orderCode={orderCode} />
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderConfirmationWrapper />
    </Suspense>
  )
}