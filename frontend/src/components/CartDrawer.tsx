'use client';
import Image from 'next/image'

import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, getProductImageUrl, transitionOrderToState, isErrorResult } from '@/lib/vendure/api';

export default function CartDrawer() {
  const router = useRouter();
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, clearCart, refreshCart } = useCart();
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const subtotal = cart?.subTotalWithTax || 0;

  return (
    <Transition show={cartOpen}>
      <Dialog onClose={setCartOpen} className="relative z-50">
        <TransitionChild
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="text-lg font-medium text-gray-900">
                          Shopping cart
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            onClick={() => setCartOpen(false)}
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon aria-hidden="true" className="size-6" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        {/* Warning banner if order stuck in ArrangingPayment 🚨 */}
                        {/* UX FIX: 2025-10-01 - Let customer know they have pending order and give escape options */}
                        {cart?.state === 'ArrangingPayment' && (
                          <div className="mb-6 rounded-md bg-yellow-50 border border-yellow-200 p-4">
                            <div className="flex">
                              <div className="shrink-0">
                                <ExclamationTriangleIcon className="size-5 text-yellow-400" aria-hidden="true" />
                              </div>
                              <div className="ml-3 flex-1">
                                <h3 className="text-sm font-medium text-yellow-800">
                                  Pending Order
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                  <p>
                                    You have an order waiting for payment. 
                                    Complete checkout or cancel to start fresh.
                                  </p>
                                </div>
                                <div className="mt-4 flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCartOpen(false);
                                      router.push('/checkout');
                                    }}
                                    className="rounded-md bg-yellow-50 px-3 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 border border-yellow-300"
                                  >
                                    Go to Checkout
                                  </button>
                                  <button
                                    type="button"
                                    disabled={cancelling}
                                    onClick={async () => {
                                      try {
                                        setCancelling(true);
                                        setCancelError(null);
                                        
                                        const result = await transitionOrderToState('Cancelled');
                                        
                                        if (isErrorResult(result)) {
                                          setCancelError('Failed to cancel order');
                                          return;
                                        }
                                        
                                        clearCart();
                                        await refreshCart();
                                        setCartOpen(false);
                                      } catch (err) {
                                        console.error('Error cancelling order:', err);
                                        setCancelError('Failed to cancel order');
                                      } finally {
                                        setCancelling(false);
                                      }
                                    }}
                                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 border border-red-300 disabled:opacity-50"
                                  >
                                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                  </button>
                                </div>
                                {cancelError && (
                                  <p className="mt-2 text-sm text-red-600">{cancelError}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!cart || cart.lines.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-500">Your cart is empty</p>
                            <Link
                              href="/shop"
                              className="mt-6 inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
                              onClick={() => setCartOpen(false)}
                            >
                              Continue Shopping
                            </Link>
                          </div>
                        ) : (
                          <div className="flow-root">
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {cart.lines.map((line) => (
                                <li key={line.id} className="flex py-6">
                                  <div className="size-24 shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <Image
                width={400}
                height={400}
                                      alt={line.productVariant.product.name}
                                      src={getProductImageUrl(line.featuredAsset?.preview, 'thumb')}
                                      className="size-full object-cover"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link
                                            href={`/shop/${line.productVariant.product.slug}`}
                                            onClick={() => setCartOpen(false)}
                                          >
                                            {line.productVariant.product.name}
                                          </Link>
                                        </h3>
                                        <p className="ml-4">
                                          {formatPrice(line.linePriceWithTax, cart.currencyCode)}
                                        </p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">
                                        {line.productVariant.name}
                                      </p>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center">
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(line.id, line.quantity - 1)}
                                          className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                        >
                                          -
                                        </button>
                                        <span className="mx-2 text-gray-700">Qty {line.quantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateQuantity(line.id, line.quantity + 1)}
                                          className="px-2 py-1 text-gray-500 hover:text-gray-700"
                                        >
                                          +
                                        </button>
                                      </div>

                                      <div className="flex">
                                        <button
                                          type="button"
                                          onClick={() => removeFromCart(line.id)}
                                          className="font-medium text-indigo-600 hover:text-indigo-500"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    {cart && cart.lines.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <p>Subtotal</p>
                          <p>{formatPrice(subtotal, cart.currencyCode)}</p>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          Shipping and taxes calculated at checkout.
                        </p>
                        <div className="mt-6 space-y-3">
                          <Link
                            href="/checkout"
                            onClick={() => setCartOpen(false)}
                            className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                          >
                            Checkout
                          </Link>
                          <Link
                            href="/cart"
                            onClick={() => setCartOpen(false)}
                            className="flex items-center justify-center rounded-md border border-indigo-600 bg-white px-6 py-3 text-base font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
                          >
                            View Cart
                          </Link>
                        </div>
                        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            or{' '}
                            <button
                              type="button"
                              onClick={() => setCartOpen(false)}
                              className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}