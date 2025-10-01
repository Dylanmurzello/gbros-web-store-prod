// hero section that goes harder than your morning coffee
import Image from 'next/image'
// big energy landing section with the grid that's chef's kiss

import Link from 'next/link'

export default function HeroSection() {
  return (
    <div className="pt-16 pb-80 sm:pt-24 sm:pb-40 lg:pt-40 lg:pb-48">
      <div className="relative mx-auto max-w-7xl px-4 sm:static sm:px-6 lg:px-8">
        <div className="sm:max-w-lg">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Premium Awards. Lasting Impact.
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Custom trophies, plaques, and medals that celebrate achievement and recognition. Built to honor every victory,
            big or small - because excellence deserves the perfect award.
          </p>
        </div>
        <div>
          <div className="mt-10">
            {/* Image grid that's absolutely unhinged with positioning */}
            <div
              aria-hidden="true"
              className="pointer-events-none lg:absolute lg:inset-y-0 lg:mx-auto lg:w-full lg:max-w-7xl"
            >
              <div className="absolute transform sm:top-0 sm:left-1/2 sm:translate-x-8 lg:top-1/2 lg:left-1/2 lg:translate-x-8 lg:-translate-y-1/2">
                <div className="flex items-center space-x-6 lg:space-x-8">
                  {/* First column - starting the vibe check */}
                  <div className="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div className="h-64 w-44 overflow-hidden rounded-lg sm:opacity-0 lg:opacity-100 relative">
                      <Image
                        alt="Premium championship trophies and awards display"
                        src="/images/homescreen/File 1.webp"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Custom engraved trophy collection"
                        src="/images/homescreen/File 2.webp"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {/* Second column - keeping it 100 */}
                  <div className="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Sports medals and achievement awards"
                        src="/images/homescreen/File 3.jpg"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Corporate recognition plaques and awards"
                        src="/images/homescreen/File 4.avif"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Crystal awards and premium trophy collection"
                        src="/images/homescreen/File 5.webp"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                  {/* Third column - finishing moves */}
                  <div className="grid shrink-0 grid-cols-1 gap-y-6 lg:gap-y-8">
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Personalized trophies and custom awards showcase"
                        src="/images/homescreen/File 6.webp"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="h-64 w-44 overflow-hidden rounded-lg relative">
                      <Image
                        alt="Professional awards and recognition products"
                        src="/images/homescreen/File 7.webp"
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA button - the "let's get this bread" button */}
            <Link
              href="/shop"
              className="inline-block rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-center font-medium text-white hover:bg-indigo-700"
            >
              Shop Awards
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
