// featured section with the deep thoughts and sustainability vibes
import Image from 'next/image'
// where we pretend we care about the planet (but actually do tho)

import Link from 'next/link'

export default function FeaturedSection() {
  return (
    <section aria-labelledby="cause-heading">
      <div className="relative bg-gray-800 px-6 py-32 sm:px-12 sm:py-40 lg:px-16">
        <div className="absolute inset-0 overflow-hidden">
          <Image
            alt=""
            src="https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-03-feature-section-full-width.jpg"
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {/* Dark overlay - moody aesthetic activated */}
        <div aria-hidden="true" className="absolute inset-0 bg-gray-900/50" />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 id="cause-heading" className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Built to Last. Made to Honor.
          </h2>
          <p className="mt-3 text-xl text-white">
            We&apos;re committed to exceptional craftsmanship and premium materials. Our attention to detail ensures
            every award perfectly represents the achievement it celebrates. Custom engraving and design - because every
            victory deserves recognition that stands the test of time.
          </p>
          <Link
            href="/about"
            className="mt-8 block w-full rounded-md border border-transparent bg-white px-8 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 sm:w-auto"
          >
            Learn About Gbros
          </Link>
        </div>
      </div>
    </section>
  )
}
