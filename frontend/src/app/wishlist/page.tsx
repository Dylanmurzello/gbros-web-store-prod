// 💖 WISHLIST PAGE - Customer wishlist management interface
// Created: 2025-09-26 - Full-featured wishlist page with cart integration
// Features: View saved items, add to cart, remove from wishlist, responsive design
// Where dreams of future purchases come to live (and occasionally die) 😭

'use client'
import Image from 'next/image'

import { useState } from 'react'
import Link from 'next/link'
import { HeartIcon, ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/outline'
import StorefrontLayout from '@/components/StorefrontLayout'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { getProductImageUrl } from '@/lib/vendure/api'

export default function WishlistPage() {
  const { items, loading, removeFromWishlist, clearWishlist } = useWishlist()
  const { addToCart } = useCart()
  const { customer } = useAuth()
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set())

  const handleRemoveItem = async (variantId: string) => {
    setRemovingItems(prev => new Set(prev).add(variantId))
    await removeFromWishlist(variantId)
    setRemovingItems(prev => {
      const next = new Set(prev)
      next.delete(variantId)
      return next
    })
  }

  const handleAddToCart = async (variantId: string) => {
    setAddingToCart(prev => new Set(prev).add(variantId))
    await addToCart(variantId, 1)
    setAddingToCart(prev => {
      const next = new Set(prev)
      next.delete(variantId)
      return next
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price / 100)
  }

  if (!customer) {
    return (
      <StorefrontLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-0">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">Sign in to view your wishlist</h2>
            <p className="mt-1 text-sm text-gray-500">
              Keep track of your favorite items by signing in to your account.
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </StorefrontLayout>
    )
  }

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-0">
          <div className="text-center">
            <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-2 text-sm text-gray-500">Loading your wishlist...</p>
          </div>
        </div>
      </StorefrontLayout>
    )
  }

  if (items.length === 0) {
    return (
      <StorefrontLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-0">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h2>
            <p className="mt-1 text-sm text-gray-500">
              Save items you love to your wishlist and they&apos;ll appear here.
            </p>
            <div className="mt-6">
              <Link
                href="/shop"
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </StorefrontLayout>
    )
  }

  return (
    <StorefrontLayout>
      <div className="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 lg:max-w-7xl lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            My Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
          </h1>
          {items.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear your wishlist?')) {
                  clearWishlist()
                }
              }}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12">
          <section aria-labelledby="cart-heading" className="lg:col-span-12">
            <h2 id="cart-heading" className="sr-only">
              Items in your wishlist
            </h2>

            <ul className="divide-y divide-gray-200 border-b border-t border-gray-200">
              {items.map((item) => {
                const imageUrl = item.productVariant.product.featuredAsset?.preview
                  ? getProductImageUrl(item.productVariant.product.featuredAsset.preview, 'medium')
                  : '/images/placeholder.png'
                const isRemoving = removingItems.has(item.productVariant.id)
                const isAdding = addingToCart.has(item.productVariant.id)

                return (
                  <li key={item.id} className="flex py-6 sm:py-10">
                    <div className="shrink-0">
                      <Image
                width={400}
                height={400}
                        alt={item.productVariant.name}
                        src={imageUrl}
                        className="h-24 w-24 rounded-md object-cover object-center sm:h-48 sm:w-48"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link
                                href={`/shop/${item.productVariant.product.slug}`}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {item.productVariant.product.name}
                              </Link>
                            </h3>
                          </div>
                          <div className="mt-1 flex text-sm">
                            <p className="text-gray-500">{item.productVariant.name}</p>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatPrice(item.productVariant.priceWithTax)}
                          </p>
                          {item.notes && (
                            <p className="mt-2 text-sm text-gray-500">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="absolute right-0 top-0">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.productVariant.id)}
                              disabled={isRemoving}
                              className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500 disabled:opacity-50"
                            >
                              <span className="sr-only">Remove</span>
                              <XMarkIcon aria-hidden="true" className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item.productVariant.id)}
                          disabled={isAdding}
                          className="flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                        >
                          <ShoppingCartIcon className="mr-2 h-4 w-4" />
                          {isAdding ? 'Adding...' : 'Add to cart'}
                        </button>
                      </div>

                      <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                        <span>Added {new Date(item.addedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        <div className="mt-16">
          <Link
            href="/shop"
            className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </StorefrontLayout>
  )
}