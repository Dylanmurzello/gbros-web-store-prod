'use client'

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

interface FacetValue {
  id: string;
  code: string;
  name: string;
  count?: number;
}

interface FilterSection {
  id: string;
  name: string;
  options: FacetValue[];
}

interface ShopFiltersProps {
  filters: FilterSection[];
  selectedFilters: string[];
  onFilterChange: (filterId: string, checked: boolean) => void;
}

export function ShopFilters({ filters, selectedFilters, onFilterChange }: ShopFiltersProps) {
  return (
    <form className="divide-y divide-gray-200">
      {filters.map((section) => (
        <div key={section.id} className="py-10 first:pt-0 last:pb-0">
          <Disclosure as="div" defaultOpen>
            <fieldset>
              <legend className="w-full">
                <DisclosureButton className="group flex w-full items-center justify-between text-left">
                  <span className="text-sm font-medium text-gray-900">{section.name}</span>
                  <span className="ml-6 flex h-7 items-center">
                    <ChevronDownIcon
                      aria-hidden="true"
                      className="size-5 rotate-0 transform group-data-[open]:-rotate-180 transition-transform"
                    />
                  </span>
                </DisclosureButton>
              </legend>
              <DisclosurePanel className="pt-6">
                <div className="space-y-3">
                  {section.options.map((option) => (
                    <div key={option.id} className="flex gap-3">
                      <div className="flex h-5 shrink-0 items-center">
                        <div className="group grid size-4 grid-cols-1">
                          <input
                            id={option.id}
                            name={`${section.id}[]`}
                            value={option.id}
                            type="checkbox"
                            checked={selectedFilters.includes(option.id)}
                            onChange={(e) => onFilterChange(option.id, e.target.checked)}
                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                          />
                          <svg
                            fill="none"
                            viewBox="0 0 14 14"
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                          >
                            <path
                              d="M3 8L6 11L11 3.5"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-[:checked]:opacity-100"
                            />
                            <path
                              d="M3 7H11"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="opacity-0 group-has-[:indeterminate]:opacity-100"
                            />
                          </svg>
                        </div>
                      </div>
                      <label htmlFor={option.id} className="text-sm text-gray-600 flex-1">
                        {option.name}
                        {option.count !== undefined && (
                          <span className="ml-1 text-gray-400">({option.count})</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </DisclosurePanel>
            </fieldset>
          </Disclosure>
        </div>
      ))}
    </form>
  );
}
