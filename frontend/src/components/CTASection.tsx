// CTA section that creates FOMO like nobody's business
import Image from 'next/image'
// sale banner that makes wallets cry but in a good way

export default function CTASection() {
  return (
    <section aria-labelledby="sale-heading">
      <div className="overflow-hidden pt-32 sm:pt-14">
        <div className="bg-gray-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative pt-48 pb-16 sm:pb-24">
              <div>
                {/* IMPROVED COPY: 2025-09-26 - Changed from "Free Engraving" to focus on customization and personalization */}
                <h2 id="sale-heading" className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  Custom Engraving.
                  <br />
                  Make It Personal.
                </h2>
                <div className="mt-6 text-base">
                  <a href="#" className="font-semibold text-white">
                    Start Your Custom Order
                    <span aria-hidden="true"> &rarr;</span>
                  </a>
                </div>
              </div>

              {/* Image collage - absolute positioning chaos but organized */}
              <div className="absolute -top-32 left-1/2 -translate-x-1/2 transform sm:top-6 sm:translate-x-0">
                <div className="ml-24 flex min-w-max space-x-6 sm:ml-3 lg:space-x-8">
                  {/* Column 1 - starting the flex */}
                  <div className="flex space-x-6 sm:flex-col sm:space-y-6 sm:space-x-0 lg:space-y-8">
                    <div className="shrink-0">
                      <Image
                        alt="Silver and pewter trophies for tournaments and competitions"
                        src="/images/homescreen/category/silver-pewter-trophies.png"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>

                    <div className="mt-6 shrink-0 sm:mt-0">
                      <Image
                        alt="Premium crystal peak award for corporate recognition"
                        src="/images/homescreen/category/crystal-peak-award.jpg"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>
                  </div>
                  {/* Column 2 - offset for that designer look */}
                  <div className="flex space-x-6 sm:-mt-20 sm:flex-col sm:space-y-6 sm:space-x-0 lg:space-y-8">
                    <div className="shrink-0">
                      <Image
                        alt="Corporate awards display for business recognition and achievements"
                        src="/images/homescreen/category/corporate-awards-display.jpg"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>

                    <div className="mt-6 shrink-0 sm:mt-0">
                      <Image
                        alt="Custom sports jersey with personalized printing and awards"
                        src="/images/homescreen/category/custom-sports-jersey.jpg"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>
                  </div>
                  {/* Column 3 - finishing strong */}
                  <div className="flex space-x-6 sm:flex-col sm:space-y-6 sm:space-x-0 lg:space-y-8">
                    <div className="shrink-0">
                      <Image
                        alt="Sports awards and achievement trophies for athletic competitions"
                        src="/images/homescreen/category/sports-awards.webp"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>

                    <div className="mt-6 shrink-0 sm:mt-0">
                      <Image
                        alt="Trophy and medal collection for all sports and achievements"
                        src="/images/homescreen/category/trophies-medals.jpg"
                        width={288}
                        height={288}
                        className="size-64 rounded-lg object-cover md:size-72"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
