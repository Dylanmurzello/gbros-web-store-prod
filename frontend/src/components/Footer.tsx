// footer where we say goodbye but also slide into your inbox
// the "we're done but not really" section

import { FooterNavigationSection } from '@/types/storefront'

// INTERFACE CLARIFICATION: 2025-09-26
// Footer component expects 'navigation' prop (NOT 'footerNavigation')
// Fixed inconsistencies across multiple pages where wrong prop name was used
// Always use: <Footer navigation={footerNavigation} /> ✅
interface FooterProps {
  navigation: FooterNavigationSection;
}

export default function Footer({ navigation }: FooterProps) {
  const footerNavigation = navigation;
  return (
    <footer aria-labelledby="footer-heading" className="bg-white">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-20 xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Link sections - organized chaos of footer links */}
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="space-y-16 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Shop</h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNavigation.shop.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-500 hover:text-gray-600">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Company</h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNavigation.company.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-500 hover:text-gray-600">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-16 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Account</h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNavigation.account.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-500 hover:text-gray-600">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Connect</h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNavigation.connect.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-500 hover:text-gray-600">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Newsletter signup - the "slide into your inbox" section */}
          <div className="mt-16 xl:mt-0">
            <h3 className="text-sm font-medium text-gray-900">Sign up for our newsletter</h3>
            <p className="mt-6 text-sm text-gray-500">Trophy news, custom award ideas, and special engraving offers delivered weekly.</p>
            <form className="mt-2 flex sm:max-w-md">
              <input
                id="email-address"
                type="text"
                required
                autoComplete="email"
                aria-label="Email address"
                className="block w-full rounded-md bg-white px-4 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />

              <div className="ml-4 shrink-0">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* PERSONALIZED FOOTER: 2025-09-26 - Replaced corporate copyright with heart-felt brand message */}
        <div className="border-t border-gray-200 py-10">
          <p className="text-sm text-gray-500">Made with ❤️ by Gbros • Crafting excellence since day one</p>
        </div>
      </div>
    </footer>
  )
}
