'use client'
import { useState } from 'react'
import Image from 'next/image'

// header navigation that's cleaner than your spotify wrapped
// desktop nav with mega menu dropdowns that hit different

import {
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react'
import { Bars3Icon, MagnifyingGlassIcon, ShoppingBagIcon, UserIcon, HeartIcon } from '@heroicons/react/24/outline'
import { NavigationData } from '@/types/storefront'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useDynamicNavigation } from '@/hooks/useDynamicNavigation'
import Link from 'next/link'
import SearchModal from '@/components/SearchModal'

interface NavigationHeaderProps {
  navigation: NavigationData;
  setOpen: (open: boolean) => void;
}

export default function NavigationHeader({ navigation, setOpen }: NavigationHeaderProps) {
  const { cart, setCartOpen } = useCart();
  const { customer, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const cartItemCount = cart?.totalQuantity || 0;
  const [searchOpen, setSearchOpen] = useState(false); // Search modal state - time to shine! 🔍
  
  // macOS dock-style dynamic navigation - only show pages when you're on them ✨
  const dynamicNavigation = useDynamicNavigation(navigation);

  return (
    <nav aria-label="Top" className="relative z-20 bg-white/90 backdrop-blur-xl backdrop-filter">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* Mobile menu trigger - the sacred hamburger */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative rounded-md bg-white p-2 text-gray-400 lg:hidden"
          >
            <span className="absolute -inset-0.5" />
            <span className="sr-only">Open menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>

          {/* Logo - where the brand identity lives rent-free */}
          <div className="ml-4 flex lg:ml-0">
            <Link href="/">
              <span className="sr-only">Gbros</span>
              <Image
                alt="Gbros Logo"
                src="/images/logos/logo.png"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop mega menus - the big brain navigation */}
          <PopoverGroup className="hidden lg:ml-8 lg:block lg:self-stretch">
            <div className="flex h-full space-x-8">
              {dynamicNavigation.categories.map((category) => (
                <Popover key={category.name} className="flex">
                  <div className="relative flex">
                    <PopoverButton className="group relative flex items-center justify-center text-sm font-medium text-gray-700 transition-colors duration-200 ease-out hover:text-gray-800 data-open:text-indigo-600">
                      {category.name}
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px z-30 h-0.5 transition duration-200 ease-out group-data-open:bg-indigo-600"
                      />
                    </PopoverButton>
                  </div>
                  <PopoverPanel
                    transition
                    className="group/popover-panel absolute inset-x-0 top-full z-20 w-full bg-white text-sm text-gray-500 transition data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                  >
                    {/* Shadow element - CSS trickery at its finest */}
                    <div aria-hidden="true" className="absolute inset-0 top-1/2 bg-white shadow-sm" />
                    <div className="relative bg-white">
                      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-10 py-16">
                          {/* Featured items - the main characters */}
                          <div className="col-start-2 grid grid-cols-2 gap-x-8">
                            {category.featured.map((item) => (
                              <div key={item.name} className="group relative text-base sm:text-sm">
                                <Image
                                  alt={item.imageAlt}
                                  src={item.imageSrc}
                                  className="aspect-square w-full rounded-lg bg-gray-100 object-cover group-hover:opacity-75"
                                />
                                <a href={item.href} className="mt-6 block font-medium text-gray-900">
                                  <span aria-hidden="true" className="absolute inset-0 z-10" />
                                  {item.name}
                                </a>
                                <p aria-hidden="true" className="mt-1">
                                  Shop now
                                </p>
                              </div>
                            ))}
                          </div>
                          {/* Category sections - organized chaos */}
                          <div className="row-start-1 grid grid-cols-3 gap-x-8 gap-y-10 text-sm">
                            {category.sections.map((section) => (
                              <div key={section.name}>
                                <p id={`${section.name}-heading`} className="font-medium text-gray-900">
                                  {section.name}
                                </p>
                                <ul
                                  role="list"
                                  aria-labelledby={`${section.name}-heading`}
                                  className="mt-6 space-y-6 sm:mt-4 sm:space-y-4"
                                >
                                  {section.items.map((item) => (
                                    <li key={item.name} className="flex">
                                      <a href={item.href} className="hover:text-gray-800">
                                        {item.name}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Border emulation - fake it till you make it */}
                    <div aria-hidden="true" className="absolute inset-0 top-0 z-10 mx-auto h-px max-w-7xl px-8">
                      <div className="h-px w-full bg-transparent transition-colors duration-200 ease-out group-data-open/popover-panel:bg-gray-200" />
                    </div>
                  </PopoverPanel>
                </Popover>
              ))}
              {/* Page links - the supporting cast + dynamic dock-style additions */}
              {dynamicNavigation.pages.map((page) => (
                <Link
                  key={page.name}
                  href={page.href}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-800"
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </PopoverGroup>

          {/* Right side actions - where the user stuff happens */}
          <div className="ml-auto flex items-center">
            {/* Desktop auth links - gatekeeping but make it fashion */}
            <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end lg:space-x-6">
              {customer ? (
                <Popover className="relative">
                  <PopoverButton className="group flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-800 focus:outline-none">
                    <UserIcon className="h-5 w-5" aria-hidden="true" />
                    <span>{customer.firstName || 'Account'}</span>
                  </PopoverButton>
                  <PopoverPanel className="absolute right-0 z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{customer.emailAddress}</p>
                    </div>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Account
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Order History
                    </Link>
                    <button
                      onClick={() => logout()}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </PopoverPanel>
                </Popover>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                    Sign in
                  </Link>
                  <span aria-hidden="true" className="h-6 w-px bg-gray-200" />
                  <Link href="/register" className="text-sm font-medium text-gray-700 hover:text-gray-800">
                    Create account
                  </Link>
                </>
              )}
            </div>

            {/* Currency selector - money moves */}
            <div className="hidden lg:ml-8 lg:flex">
              <a href="#" className="flex items-center text-gray-700 hover:text-gray-800">
                <Image
                  alt="USA Flag"
                  src="/images/flags/flag-usa.svg"
                  width={20}
                  height={15}
                  className="block h-auto w-5 shrink-0"
                />
                <span className="ml-3 block text-sm font-medium">USD</span>
                <span className="sr-only">, change currency</span>
              </a>
            </div>

            {/* Search - NOW WITH ACTUAL ELASTICSEARCH POWER! 🚀 */}
            <div className="flex lg:ml-6">
              <button 
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Search</span>
                <MagnifyingGlassIcon aria-hidden="true" className="size-6" />
              </button>
            </div>

            {/* Wishlist - where dreams are saved */}
            <div className="ml-4 flow-root lg:ml-6">
              <Link
                href="/wishlist"
                className="group -m-2 flex items-center p-2"
              >
                <HeartIcon
                  aria-hidden="true"
                  className="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                />
                {wishlistCount > 0 && (
                  <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                    {wishlistCount}
                  </span>
                )}
                <span className="sr-only">items in wishlist</span>
              </Link>
            </div>

            {/* Cart - where dreams become purchases */}
            <div className="ml-4 flow-root lg:ml-6">
              <button
                onClick={() => setCartOpen(true)}
                className="group -m-2 flex items-center p-2"
              >
                <ShoppingBagIcon
                  aria-hidden="true"
                  className="size-6 shrink-0 text-gray-400 group-hover:text-gray-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-800">
                  {cartItemCount}
                </span>
                <span className="sr-only">items in cart, view bag</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Modal - The star of the show! 🌟 */}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}
