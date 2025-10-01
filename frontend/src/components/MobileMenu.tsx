'use client'
import Image from 'next/image'

// mobile menu that slides out like "surprise mf" when you tap that hamburger
// gen z approved mobile navigation with all the vibes

import { Fragment } from 'react'
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
} from '@headlessui/react'
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { NavigationData } from '@/types/storefront'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'

interface MobileMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  navigation: NavigationData;
}

export default function MobileMenu({ open, setOpen, navigation }: MobileMenuProps) {
  const { customer, logout } = useAuth();

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-40 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/25 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />
      <div className="fixed inset-0 z-40 flex">
        <DialogPanel
          transition
          className="relative flex w-full max-w-xs transform flex-col overflow-y-auto bg-white pb-12 shadow-xl transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          {/* Close button that's lowkey essential for UX */}
          <div className="flex px-4 pt-5 pb-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Close menu</span>
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>

          {/* Tab navigation for categories - swipe culture approved */}
          <TabGroup className="mt-2">
            <div className="border-b border-gray-200">
              <TabList className="-mb-px flex space-x-8 px-4">
                {navigation.categories.map((category) => (
                  <Tab
                    key={category.name}
                    className="flex-1 border-b-2 border-transparent px-1 py-4 text-base font-medium whitespace-nowrap text-gray-900 data-selected:border-indigo-600 data-selected:text-indigo-600"
                  >
                    {category.name}
                  </Tab>
                ))}
              </TabList>
            </div>
            <TabPanels as={Fragment}>
              {navigation.categories.map((category) => (
                <TabPanel key={category.name} className="space-y-10 px-4 pt-10 pb-8">
                  <div className="grid grid-cols-2 gap-x-4">
                    {category.featured.map((item) => (
                      <div key={item.name} className="group relative text-sm">
                        <Image
                fill
                sizes="(max-width: 640px) 100vw, 50vw"
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
                  {category.sections.map((section) => (
                    <div key={section.name}>
                      <p id={`${category.id}-${section.id}-heading-mobile`} className="font-medium text-gray-900">
                        {section.name}
                      </p>
                      <ul
                        role="list"
                        aria-labelledby={`${category.id}-${section.id}-heading-mobile`}
                        className="mt-6 flex flex-col space-y-6"
                      >
                        {section.items.map((item) => (
                          <li key={item.name} className="flow-root">
                            <a href={item.href} className="-m-2 block p-2 text-gray-500">
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </TabPanel>
              ))}
            </TabPanels>
          </TabGroup>

          {/* Pages links - the misc stuff that doesn't fit in categories */}
          <div className="space-y-6 border-t border-gray-200 px-4 py-6">
            {navigation.pages.map((page) => (
              <div key={page.name} className="flow-root">
                <a href={page.href} className="-m-2 block p-2 font-medium text-gray-900">
                  {page.name}
                </a>
              </div>
            ))}
          </div>

          {/* Auth links - where the magic happens (or doesn't if you're not logged in) */}
          <div className="space-y-6 border-t border-gray-200 px-4 py-6">
            {customer ? (
              <>
                <div className="flex items-center px-2">
                  <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{customer.emailAddress}</p>
                  </div>
                </div>
                <div className="flow-root">
                  <Link href="/account" className="-m-2 block p-2 font-medium text-gray-900">
                    My Account
                  </Link>
                </div>
                <div className="flow-root">
                  <Link href="/orders" className="-m-2 block p-2 font-medium text-gray-900">
                    Order History
                  </Link>
                </div>
                <div className="flow-root">
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="-m-2 block w-full text-left p-2 font-medium text-gray-900"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flow-root">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="-m-2 block p-2 font-medium text-gray-900"
                  >
                    Sign in
                  </Link>
                </div>
                <div className="flow-root">
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="-m-2 block p-2 font-medium text-gray-900"
                  >
                    Create account
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Currency selector - cause we international like that */}
          <div className="border-t border-gray-200 px-4 py-6">
            <a href="#" className="-m-2 flex items-center p-2">
              <Image
                alt="USA Flag"
                src="/images/flags/flag-usa.svg"
                className="block h-auto w-5 shrink-0"
              />
              <span className="ml-3 block text-base font-medium text-gray-900">USD</span>
              <span className="sr-only">, change currency</span>
            </a>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
