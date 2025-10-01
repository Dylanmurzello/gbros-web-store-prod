'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { CheckIcon, QuestionMarkCircleIcon, XMarkIcon as XMarkIconMini } from '@heroicons/react/20/solid';
import NavigationHeader from '@/components/NavigationHeader';
import Footer from '@/components/Footer';
import MobileMenu from '@/components/MobileMenu';
import CartDrawer from '@/components/CartDrawer';
import { navigation, footerNavigation } from '@/data/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatPrice, getProductImageUrl, searchProducts } from '@/lib/vendure/api';

export default function CartPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<{ id: string; slug: string; name: string; featuredAsset?: { source: string }; priceWithTax: { min: number; max: number } }[]>([]);
  const { cart, updateQuantity, removeFromCart } = useCart();

  // Fetch related products dynamically
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        const result = await searchProducts({
          take: 4,
          groupByProduct: true,
        });
        // Map the result items to the expected format
        const mapped = result.items?.map(item => ({
          id: item.productId,
          slug: item.slug,
          name: item.productName,
          featuredAsset: item.productAsset ? { source: item.productAsset.preview } : undefined,
          priceWithTax: typeof item.priceWithTax === 'number'
            ? { min: item.priceWithTax, max: item.priceWithTax }
            : item.priceWithTax
        })) || [];
        setRelatedProducts(mapped);
      } catch (error) {
        console.error('Failed to fetch related products:', error);
      }
    };
    fetchRelatedProducts();
  }, []);

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="bg-white">
        <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
        <CartDrawer />

        <header className="relative overflow-hidden">
          <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
        </header>

        <main className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
          <div className="mt-12 text-center">
            <p className="text-xl text-gray-500 mb-8">Your cart is empty</p>
            <Link
              href="/shop"
              className="inline-block rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>
          </div>
        </main>

        <Footer navigation={footerNavigation} />
      </div>
    );
  }

  const subtotal = cart.subTotalWithTax;
  const shipping = cart.shippingWithTax || 500; // Default $5 shipping
  const taxRate = 0.08; // 8% tax rate
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + shipping + tax;

  return (
    <div className="bg-white">
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
      <CartDrawer />

      <header className="relative overflow-hidden">
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>

        <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
          <section aria-labelledby="cart-heading" className="lg:col-span-7">
            <h2 id="cart-heading" className="sr-only">
              Items in your shopping cart
            </h2>

            <ul role="list" className="divide-y divide-gray-200 border-t border-b border-gray-200">
              {cart.lines.map((line) => {
                const product = line.productVariant.product;
                const variant = line.productVariant;

                return (
                  <li key={line.id} className="flex py-6 sm:py-10">
                    <div className="shrink-0">
                      <Image
                        alt={product.name}
                        src={getProductImageUrl(line.featuredAsset?.preview, 'small')}
                        width={192}
                        height={192}
                        className="size-24 rounded-md object-cover sm:size-48"
                      />
                    </div>

                    <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                      <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                        <div>
                          <div className="flex justify-between">
                            <h3 className="text-sm">
                              <Link
                                href={`/shop/${product.slug}`}
                                className="font-medium text-gray-700 hover:text-gray-800"
                              >
                                {product.name}
                              </Link>
                            </h3>
                          </div>
                          <div className="mt-1 flex text-sm">
                            <p className="text-gray-500">{variant.name}</p>
                          </div>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatPrice(line.unitPriceWithTax, cart.currencyCode)}
                          </p>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:pr-9">
                          <div className="inline-grid w-full max-w-16 grid-cols-1">
                            <select
                              value={line.quantity}
                              onChange={(e) => updateQuantity(line.id, parseInt(e.target.value))}
                              aria-label={`Quantity, ${product.name}`}
                              className="col-start-1 row-start-1 appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                            <ChevronDownIcon
                              aria-hidden="true"
                              className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                            />
                          </div>

                          <div className="absolute top-0 right-0">
                            <button
                              type="button"
                              onClick={() => removeFromCart(line.id)}
                              className="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500"
                            >
                              <span className="sr-only">Remove</span>
                              <XMarkIconMini aria-hidden="true" className="size-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 flex space-x-2 text-sm text-gray-700">
                        <CheckIcon aria-hidden="true" className="size-5 shrink-0 text-green-500" />
                        <span>In stock</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Order summary */}
          <section
            aria-labelledby="summary-heading"
            className="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8"
          >
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Order summary
            </h2>

            <dl className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <dt className="text-sm text-gray-600">Subtotal</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatPrice(subtotal, cart.currencyCode)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex items-center text-sm text-gray-600">
                  <span>Shipping estimate</span>
                  <a href="#" className="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Learn more about how shipping is calculated</span>
                    <QuestionMarkCircleIcon aria-hidden="true" className="size-5" />
                  </a>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatPrice(shipping, cart.currencyCode)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="flex text-sm text-gray-600">
                  <span>Tax estimate</span>
                  <a href="#" className="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                    <span className="sr-only">Learn more about how tax is calculated</span>
                    <QuestionMarkCircleIcon aria-hidden="true" className="size-5" />
                  </a>
                </dt>
                <dd className="text-sm font-medium text-gray-900">
                  {formatPrice(tax, cart.currencyCode)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <dt className="text-base font-medium text-gray-900">Order total</dt>
                <dd className="text-base font-medium text-gray-900">
                  {formatPrice(total, cart.currencyCode)}
                </dd>
              </div>
            </dl>

            <div className="mt-6">
              <Link
                href="/checkout"
                className="block w-full rounded-md border border-transparent bg-indigo-600 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden text-center"
              >
                Checkout
              </Link>
            </div>
          </section>
        </form>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-24">
            <h2 id="related-heading" className="text-lg font-medium text-gray-900">
              You may also like&hellip;
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((product) => {
                const price = typeof product.priceWithTax === 'object'
                  ? product.priceWithTax.min
                  : product.priceWithTax;

                return (
                  <div key={product.id} className="group relative">
                    <Link href={`/shop/${product.slug}`}>
                      <Image
                        alt={product.name}
                        src={getProductImageUrl(product.featuredAsset?.source, 'medium')}
                        width={400}
                        height={400}
                        className="aspect-square w-full rounded-md object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80"
                      />
                      <div className="mt-4 flex justify-between">
                        <div>
                          <h3 className="text-sm text-gray-700">
                            <span aria-hidden="true" className="absolute inset-0" />
                            {product.name}
                          </h3>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {formatPrice(price, 'USD')}
                        </p>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer navigation={footerNavigation} />
    </div>
  );
}