// category section where we organize the chaos into shoppable vibes
import Image from 'next/image'
// grid layout that's more organized than your life rn

export default function CategorySection() {
  return (
    <section aria-labelledby="category-heading" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="sm:flex sm:items-baseline sm:justify-between">
          <h2 id="category-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Shop by Category
          </h2>
          <a href="#" className="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block">
            Browse all categories
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>

        {/* Category grid - where the magic happens */}
        <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:grid-rows-2 sm:gap-x-6 lg:gap-8">
          {/* Big boy category - takes up 2 rows like a boss */}
          <div className="group relative aspect-2/1 overflow-hidden rounded-lg sm:row-span-2 sm:aspect-square">
            <Image
              alt="Premium sports trophies and championship awards for all athletic achievements."
              src="/images/homescreen/category/sports-awards.webp"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:opacity-75"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-transparent to-black opacity-50"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <div>
                <h3 className="font-semibold text-white">
                  <a href="#">
                    <span className="absolute inset-0" />
                    Sports Awards
                  </a>
                </h3>
                <p aria-hidden="true" className="mt-1 text-sm text-white">
                  Shop now
                </p>
              </div>
            </div>
          </div>
          {/* Smaller categories - the supporting cast but still fire */}
          <div className="group relative aspect-2/1 overflow-hidden rounded-lg sm:aspect-auto">
            <Image
              alt="Collection of premium trophies and medals displayed on elegant presentation shelving."
              src="/images/homescreen/category/trophies-medals.jpg"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:opacity-75"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-transparent to-black opacity-50"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <div>
                <h3 className="font-semibold text-white">
                  <a href="#">
                    <span className="absolute inset-0" />
                    Trophies & Medals
                  </a>
                </h3>
                <p aria-hidden="true" className="mt-1 text-sm text-white">
                  Shop now
                </p>
              </div>
            </div>
          </div>
          <div className="group relative aspect-2/1 overflow-hidden rounded-lg sm:aspect-auto">
            <Image
              alt="Elegant corporate plaques and achievement awards in premium materials on executive desk."
              src="https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-03-category-02.jpg"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover group-hover:opacity-75"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-b from-transparent to-black opacity-50"
            />
            <div className="absolute inset-0 flex items-end p-6">
              <div>
                <h3 className="font-semibold text-white">
                  <a href="#">
                    <span className="absolute inset-0" />
                    Corporate Plaques
                  </a>
                </h3>
                <p aria-hidden="true" className="mt-1 text-sm text-white">
                  Shop now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile link - cause mobile users need love too */}
        <div className="mt-6 sm:hidden">
          <a href="#" className="block text-sm font-semibold text-indigo-600 hover:text-indigo-500">
            Browse all categories
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </section>
  )
}
