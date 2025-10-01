'use client'
import Image from 'next/image'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react'
import {
  HeartIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { StarIcon } from '@heroicons/react/20/solid'
import NavigationHeader from '@/components/NavigationHeader'
import Footer from '@/components/Footer'
import MobileMenu from '@/components/MobileMenu'
import { navigation, footerNavigation } from '@/data/navigation'
import { graphqlClient } from '@/lib/vendure/client'
import { GET_PRODUCT, SEARCH_PRODUCTS } from '@/lib/vendure/queries'
import { getProductImageUrl } from '@/lib/vendure/api'
import CartDrawer from '@/components/CartDrawer'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'

// interfaces keeping our types clean like a fresh trophy polish 🏆
interface ProductVariant {
  id: string
  name: string
  sku: string
  price: number
  priceWithTax: number
  currencyCode: string
  featuredAsset?: {
    id: string
    preview: string
    source: string
  }
  stockLevel: string
  options: Array<{
    id: string
    code: string
    name: string
    group: {
      id: string
      code: string
      name: string
    }
  }>
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  featuredAsset?: {
    id: string
    preview: string
    source: string
  }
  assets: Array<{
    id: string
    preview: string
    source: string
  }>
  variants: ProductVariant[]
  facetValues: Array<{
    id: string
    code: string
    name: string
    facet: {
      id: string
      code: string
      name: string
    }
  }>
  collections: Array<{
    id: string
    name: string
    slug: string
    breadcrumbs: Array<{
      id: string
      name: string
      slug: string
    }>
  }>
}

interface RelatedProduct {
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
}

// trophy product details - the juicy stuff that sells awards 💀
const trophyDetails = [
  {
    name: 'Features',
    items: [
      'Custom engraving included',
      'Premium materials only',
      'Scratch-resistant finish',
      'Weighted base for stability',
      'Gift box packaging available',
      'Multiple size options',
      'Rush production available',
    ],
  },
  {
    name: 'Materials & Craftsmanship',
    items: [
      'High-quality metal alloys',
      'Crystal glass components',
      'Precision laser engraving',
      'Hand-polished finish',
      'UV-resistant coatings',
      'Lead-free materials',
    ],
  },
  {
    name: 'Shipping & Delivery',
    items: [
      'Free shipping on orders over $75',
      'Express shipping available',
      'Secure packaging guaranteed',
      'Tracking provided for all orders',
      'International shipping available',
      'Bulk order discounts',
    ],
  },
  {
    name: 'Returns & Warranty',
    items: [
      '30-day satisfaction guarantee',
      'Free returns on defective items',
      'Lifetime warranty on craftsmanship',
      'Easy exchange process',
      'Full refund if not satisfied',
    ],
  },
]

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [addingToCart, setAddingToCart] = useState(false)
  
  // fetch that product data like we're treasure hunting 🗺️
  useEffect(() => {
    if (slug) {
      fetchProduct(slug)
      fetchRelatedProducts()
    }
  }, [slug])
  
  const fetchProduct = async (productSlug: string) => {
    try {
      setLoading(true)
      const result = await graphqlClient.request<{ product: Product }>(GET_PRODUCT, {
        slug: productSlug
      })
      
      if (result.product) {
        setProduct(result.product)
        // set the first variant as default, real ones always have a backup
        if (result.product.variants.length > 0) {
          setSelectedVariant(result.product.variants[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      // product not found, tragic but we move
    } finally {
      setLoading(false)
    }
  }
  
  const fetchRelatedProducts = async () => {
    try {
      // just grab some products for the related section
      const result = await graphqlClient.request<{ search: { items: RelatedProduct[] } }>(SEARCH_PRODUCTS, {
        input: {
          take: 4,
          skip: Math.floor(Math.random() * 10), // random offset for variety
          groupByProduct: true
        }
      })
      setRelatedProducts(result.search.items)
    } catch (error) {
      console.error('Failed to fetch related products:', error)
      // no related products? that's fine we're independent
    }
  }
  
  // format that price like we got money 💰
  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price / 100)
  }
  
  // handle variant option changes - when customers get picky about their trophies
  const handleOptionChange = (groupId: string, optionId: string) => {
    const newOptions = { ...selectedOptions, [groupId]: optionId }
    setSelectedOptions(newOptions)
    
    // find the variant that matches selected options
    if (product) {
      const matchingVariant = product.variants.find(variant => 
        variant.options.every(option => 
          newOptions[option.group.id] === option.id
        )
      )
      if (matchingVariant) {
        setSelectedVariant(matchingVariant)
      }
    }
  }
  
  // add to cart handler - where dreams become shopping carts
  const handleAddToCart = async () => {
    if (!selectedVariant) return

    setAddingToCart(true)
    try {
      await addToCart(selectedVariant.id, quantity)
      // reset quantity after successful add
      setQuantity(1)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }
  
  if (loading) {
    // loading skeleton that doesn't look crusty
    return (
      <div className="bg-white">
        <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
        
        <main className="mx-auto max-w-7xl sm:px-6 sm:pt-16 lg:px-8">
          <div className="animate-pulse">
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer navigation={footerNavigation} />
      </div>
    )
  }
  
  if (!product) {
    // product not found - L + ratio + no trophy for you
    return (
      <div className="bg-white">
        <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />
        <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
        
        <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
            <p className="mt-2 text-gray-600">Sorry, we couldn&apos;t find that trophy. Maybe it won an award for hide and seek?</p>
            <Link href="/shop" className="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
              Back to shop
            </Link>
          </div>
        </main>
        
        <Footer navigation={footerNavigation} />
      </div>
    )
  }
  
  // get images for gallery - all the angles of glory
  const productImages = (() => {
    const seen = new Set<string>()
    const images: typeof product.assets = []
    
    // add featured asset first if it exists and hasn't been seen
    if (product.featuredAsset && !seen.has(product.featuredAsset.id)) {
      seen.add(product.featuredAsset.id)
      images.push(product.featuredAsset)
    }
    
    // add other assets that aren't duplicates
    for (const asset of product.assets) {
      if (!seen.has(asset.id)) {
        seen.add(asset.id)
        images.push(asset)
        if (images.length >= 4) break // max 4 images for the gallery
      }
    }
    
    return images
  })()
  
  // extract option groups from variants
  const optionGroups = product.variants.length > 0 
    ? Array.from(new Set(product.variants[0].options.map(o => o.group.id)))
        .map(groupId => {
          const firstOption = product.variants[0].options.find(o => o.group.id === groupId)
          if (!firstOption) return null
          
          return {
            id: groupId,
            name: firstOption.group.name,
            code: firstOption.group.code,
            options: Array.from(new Set(
              product.variants.flatMap(v => 
                v.options
                  .filter(o => o.group.id === groupId)
                  .map(o => JSON.stringify({ id: o.id, name: o.name, code: o.code }))
              )
            )).map(o => JSON.parse(o))
          }
        }).filter(Boolean)
    : []
  
  // calculate rating from a fake algorithm (we're honest about our dishonesty)
  const rating = 4 + (product.id.charCodeAt(0) % 2) // 4 or 5 stars based on ID
  
  return (
    <div className="bg-white">
      {/* Mobile menu - sliding in your DMs since 2024 */}
      <MobileMenu open={mobileMenuOpen} setOpen={setMobileMenuOpen} navigation={navigation} />

      {/* Cart drawer - slide out cart */}
      <CartDrawer />

      <NavigationHeader navigation={navigation} setOpen={setMobileMenuOpen} />
      
      <main className="mx-auto max-w-7xl sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-2xl lg:max-w-none">
          {/* Breadcrumbs - leaving a trail like Hansel and Gretel */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol role="list" className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-sm text-gray-500 hover:text-gray-600">
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-2 text-gray-400">/</span>
                <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-600">
                  Shop
                </Link>
              </li>
              {product.collections.length > 0 && (
                <li>
                  <span className="mx-2 text-gray-400">/</span>
                  <Link 
                    href={`/shop?collection=${product.collections[0].slug}`}
                    className="text-sm text-gray-500 hover:text-gray-600"
                  >
                    {product.collections[0].name}
                  </Link>
                </li>
              )}
              <li>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-sm text-gray-900">{product.name}</span>
              </li>
            </ol>
          </nav>
          
          {/* Product details - where the magic happens ✨ */}
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            {/* Image gallery - beauty shots only */}
            <TabGroup className="flex flex-col-reverse">
              {/* Image selector */}
              {productImages.length > 1 && (
                <div className="mx-auto mt-6 hidden w-full max-w-2xl sm:block lg:max-w-none">
                  <TabList className="grid grid-cols-4 gap-6">
                    {productImages.map((image, index) => (
                      <Tab
                        key={`thumb-${image.id}-${index}`}
                        className="group relative flex h-24 cursor-pointer items-center justify-center rounded-md bg-white text-sm font-medium text-gray-900 uppercase hover:bg-gray-50 focus:ring-3 focus:ring-indigo-500/50 focus:ring-offset-4 focus:outline-hidden"
                      >
                        <span className="sr-only">View image {index + 1}</span>
                        <span className="absolute inset-0 overflow-hidden rounded-md">
                          <Image
                width={400}
                height={400}
                            alt=""
                            src={getProductImageUrl(image.preview, 'thumb')}
                            className="size-full object-cover"
                            loading="lazy"
                          />
                        </span>
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-transparent ring-offset-2 group-data-selected:ring-indigo-500"
                        />
                      </Tab>
                    ))}
                  </TabList>
                </div>
              )}
              
              <TabPanels>
                {productImages.map((image, index) => (
                  <TabPanel key={`panel-${image.id}-${index}`}>
                    <Image
                width={400}
                height={400}
                      alt={product.name}
                      src={getProductImageUrl(image.source || image.preview, 'detail')}
                      className="aspect-square w-full object-cover sm:rounded-lg"
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </TabPanel>
                ))}
              </TabPanels>
            </TabGroup>
            
            {/* Product info - the deets that matter */}
            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{product.name}</h1>
              
              <div className="mt-3">
                <h2 className="sr-only">Product information</h2>
                <p className="text-3xl tracking-tight text-gray-900">
                  {selectedVariant && formatPrice(selectedVariant.priceWithTax, selectedVariant.currencyCode)}
                </p>
              </div>
              
              {/* Reviews - totally real and not suspicious at all */}
              <div className="mt-3">
                <h3 className="sr-only">Reviews</h3>
                <div className="flex items-center">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <StarIcon
                        key={index}
                        aria-hidden="true"
                        className={classNames(
                          rating > index ? 'text-indigo-500' : 'text-gray-300',
                          'size-5 shrink-0',
                        )}
                      />
                    ))}
                  </div>
                  <p className="sr-only">{rating} out of 5 stars</p>
                  <p className="ml-2 text-sm text-gray-500">
                    ({Math.floor(Math.random() * 100) + 50} reviews)
                  </p>
                </div>
              </div>
              
              {/* Description - selling the dream */}
              <div className="mt-6">
                <h3 className="sr-only">Description</h3>
                <div className="space-y-6 text-base text-gray-700">
                  <p>{product.description}</p>
                  <p className="text-sm text-gray-600">
                    This premium award is perfect for recognizing excellence and achievement. 
                    Each piece is carefully crafted with attention to detail and can be customized 
                    with your personal message or logo.
                  </p>
                </div>
              </div>
              
              <form onSubmit={handleAddToCart} className="mt-6">
                {/* Variant options - when one size doesn't fit all */}
                {optionGroups.map((group) => group && (
                  <div key={group.id} className="mt-6">
                    <h3 className="text-sm font-medium text-gray-900">{group.name}</h3>
                    <fieldset aria-label={`Choose a ${group.name}`} className="mt-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {group.options.map((option: { id: string; name: string; code: string }) => (
                          <label
                            key={option.id}
                            className={classNames(
                              selectedOptions[group.id] === option.id
                                ? 'border-indigo-600 ring-2 ring-indigo-600'
                                : 'border-gray-300',
                              'relative flex cursor-pointer items-center justify-center rounded-md border px-4 py-2 text-sm font-medium uppercase hover:bg-gray-50 focus:outline-none sm:flex-1'
                            )}
                          >
                            <input
                              type="radio"
                              name={group.id}
                              value={option.id}
                              checked={selectedOptions[group.id] === option.id}
                              onChange={() => handleOptionChange(group.id, option.id)}
                              className="sr-only"
                            />
                            <span>{option.name}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                ))}
                
                {/* Quantity selector - go big or go home */}
                <div className="mt-6">
                  <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                    Quantity
                  </label>
                  <select
                    id="quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="mt-2 block w-full rounded-md border-gray-300 py-2 px-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 10, 25, 50].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
                
                {/* Add to cart - the moment of truth */}
                <div className="mt-10 flex">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stockLevel === '0' || addingToCart}
                    className={classNames(
                      selectedVariant?.stockLevel === '0'
                        ? 'bg-gray-400 cursor-not-allowed'
                        : addingToCart
                        ? 'bg-indigo-500'
                        : 'bg-indigo-600 hover:bg-indigo-700',
                      'flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent px-8 py-3 text-base font-medium text-white focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 focus:outline-hidden sm:w-full'
                    )}
                  >
                    {selectedVariant?.stockLevel === '0' ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedVariant) return
                      const inWishlist = isInWishlist(selectedVariant.id)
                      if (inWishlist) {
                        removeFromWishlist(selectedVariant.id)
                      } else {
                        addToWishlist(selectedVariant.id)
                      }
                    }}
                    className={`ml-4 flex items-center justify-center rounded-md px-3 py-3 transition-colors ${
                      selectedVariant && isInWishlist(selectedVariant.id)
                        ? 'text-red-600 bg-red-50 hover:bg-red-100'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-500'
                    }`}
                  >
                    <HeartIcon
                      aria-hidden="true"
                      className={`size-6 shrink-0 ${
                        selectedVariant && isInWishlist(selectedVariant.id) ? 'fill-current' : ''
                      }`}
                    />
                    <span className="sr-only">
                      {selectedVariant && isInWishlist(selectedVariant.id) ? 'Remove from' : 'Add to'} favorites
                    </span>
                  </button>
                </div>
                
                {/* Stock level - keeping it real */}
                {selectedVariant && (
                  <p className="mt-4 text-sm text-gray-600">
                    {selectedVariant.stockLevel === 'IN_STOCK' 
                      ? '✓ In stock and ready to ship'
                      : selectedVariant.stockLevel === 'LOW_STOCK'
                      ? '⚠️ Low stock - order soon!'
                      : '❌ Currently out of stock'
                    }
                  </p>
                )}
              </form>
              
              {/* Product details accordion - all the nerdy specs */}
              <section aria-labelledby="details-heading" className="mt-12">
                <h2 id="details-heading" className="sr-only">
                  Additional details
                </h2>
                
                <div className="divide-y divide-gray-200 border-t border-gray-200">
                  {trophyDetails.map((detail) => (
                    <Disclosure key={detail.name} as="div">
                      <h3>
                        <DisclosureButton className="group relative flex w-full items-center justify-between py-6 text-left">
                          <span className="text-sm font-medium text-gray-900 group-data-open:text-indigo-600">
                            {detail.name}
                          </span>
                          <span className="ml-6 flex items-center">
                            <PlusIcon
                              aria-hidden="true"
                              className="block size-6 text-gray-400 group-hover:text-gray-500 group-data-open:hidden"
                            />
                            <MinusIcon
                              aria-hidden="true"
                              className="hidden size-6 text-indigo-400 group-hover:text-indigo-500 group-data-open:block"
                            />
                          </span>
                        </DisclosureButton>
                      </h3>
                      <DisclosurePanel className="pb-6">
                        <ul
                          role="list"
                          className="list-disc space-y-1 pl-5 text-sm/6 text-gray-700 marker:text-gray-300"
                        >
                          {detail.items.map((item) => (
                            <li key={item} className="pl-2">
                              {item}
                            </li>
                          ))}
                        </ul>
                      </DisclosurePanel>
                    </Disclosure>
                  ))}
                </div>
              </section>
            </div>
          </div>
          
          {/* Related products - more trophies to tempt you with */}
          {relatedProducts.length > 0 && (
            <section aria-labelledby="related-heading" className="mt-10 border-t border-gray-200 px-4 py-16 sm:px-0">
              <h2 id="related-heading" className="text-xl font-bold text-gray-900">
                Customers also viewed
              </h2>
              
              <div className="mt-8 grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.productId}>
                    <Link href={`/shop/${relatedProduct.slug}`} className="group">
                      <div className="relative h-72 w-full overflow-hidden rounded-lg bg-gray-100">
                        {relatedProduct.productAsset ? (
                          <Image
                width={400}
                height={400}
                            alt={relatedProduct.productName}
                            src={getProductImageUrl(relatedProduct.productAsset.preview, 'small')}
                            className="size-full object-cover group-hover:opacity-75 transition-opacity"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900">{relatedProduct.productName}</h3>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{relatedProduct.description}</p>
                        <p className="mt-2 text-base font-medium text-gray-900">
                          {relatedProduct.priceWithTax.value 
                            ? formatPrice(relatedProduct.priceWithTax.value, relatedProduct.currencyCode)
                            : relatedProduct.priceWithTax.min && relatedProduct.priceWithTax.max
                            ? `${formatPrice(relatedProduct.priceWithTax.min, relatedProduct.currencyCode)} - ${formatPrice(relatedProduct.priceWithTax.max, relatedProduct.currencyCode)}`
                            : 'Price varies'
                          }
                        </p>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      
      {/* FIXED: 2025-09-26 - Corrected Footer prop from 'footerNavigation={...}' to 'navigation={...}'
          Previous bug: Footer component expected 'navigation' prop but received 'footerNavigation'
          Result: Footer links weren't rendering properly - now consistent across all pages ✨ */}
      <Footer navigation={footerNavigation} />
    </div>
  )
}
