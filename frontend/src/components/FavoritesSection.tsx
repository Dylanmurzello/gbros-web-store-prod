// favorites section - the "these slap different" product showcase
import Image from 'next/image'
// grid of products that are absolutely fire no cap

import { FeaturedProduct } from '@/hooks/useFeaturedProducts'
import Link from 'next/link'

interface FavoritesSectionProps {
  favorites: FeaturedProduct[];
  loading?: boolean;
}

export default function FavoritesSection({ favorites, loading = false }: FavoritesSectionProps) {
  return (
    <section aria-labelledby="favorites-heading">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2 id="favorites-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Our Favorites
          </h2>
          <Link href="/shop" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block">
            Browse all products
            <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>

        {/* Product grid - where the drip lives */}
        <div className="mt-6 grid grid-cols-1 gap-y-10 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-0 lg:gap-x-8">
          {loading ? (
            // Loading skeleton - keeping it smooth while we fetch the goods
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="group relative animate-pulse">
                <div className="h-96 w-full rounded-lg bg-gray-200 sm:aspect-2/3 sm:h-auto"></div>
                <div className="mt-4 h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="mt-1 h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          ) : favorites.length > 0 ? (
            // Real products from the store - this is the good stuff
            // FIXED: 2025-09-26 - Added index to key to prevent React duplicate key warnings
            favorites.map((favorite, index) => (
              <div key={`${favorite.id}-${index}`} className="group relative">
                <Image
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
                  alt={favorite.imageAlt}
                  src={favorite.imageSrc}
                  className="h-96 w-full rounded-lg object-cover group-hover:opacity-75 sm:aspect-2/3 sm:h-auto"
                />
                <h3 className="mt-4 text-base font-semibold text-gray-900">
                  <Link href={favorite.href}>
                    <span className="absolute inset-0" />
                    {favorite.name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-gray-500">{favorite.price}</p>
              </div>
            ))
          ) : (
            // Fallback if no products found - rare but we handle it like pros
            <div className="col-span-3 text-center text-gray-500 py-12">
              <p>No featured products available at the moment. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Mobile browse link - mobile gang rise up */}
        <div className="mt-6 sm:hidden">
          <Link href="/shop" className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Browse all products
            <span aria-hidden="true"> &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
