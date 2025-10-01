'use client'

// macOS dock-style dynamic navigation that's cleaner than apple's own design
// pages only appear when you're on them - no clutter gang 💯

import { usePathname } from 'next/navigation'
import { NavigationData } from '@/types/storefront'

// Dynamic pages that can appear in nav when visited
const DYNAMIC_PAGES = [
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/contact' },
  // Add more dynamic pages here as needed
]

interface DynamicNavigationData extends NavigationData {
  pages: Array<{ name: string; href: string }>
}

export function useDynamicNavigation(staticNavigation: NavigationData): DynamicNavigationData {
  const pathname = usePathname()
  
  // Start with static navigation pages
  const dynamicPages = [...staticNavigation.pages]
  
  // Check if current page should be dynamically added
  const currentDynamicPage = DYNAMIC_PAGES.find(page => pathname === page.href)
  
  // Add current dynamic page if it exists and isn't already in static nav
  if (currentDynamicPage && !staticNavigation.pages.find(page => page.href === currentDynamicPage.href)) {
    dynamicPages.push(currentDynamicPage)
  }
  
  return {
    ...staticNavigation,
    pages: dynamicPages
  }
}


