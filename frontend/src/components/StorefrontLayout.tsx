'use client'

// main storefront layout that brings all the components together like avengers assemble
// this is where all the magic happens fr fr no cap

import { useState } from 'react'
import MobileMenu from '@/components/MobileMenu'
import NavigationHeader from '@/components/NavigationHeader'
import HeroSection from '@/components/HeroSection'
import CategorySection from '@/components/CategorySection'
import FeaturedSection from '@/components/FeaturedSection'
import FavoritesSection from '@/components/FavoritesSection'
import CTASection from '@/components/CTASection'
import Footer from '@/components/Footer'
import CartDrawer from '@/components/CartDrawer'
import { navigation, footerNavigation } from '@/data/navigation'
import { useFeaturedProducts } from '@/hooks/useFeaturedProducts'
import { ReactNode } from 'react'

interface StorefrontLayoutProps {
  children?: ReactNode
  showHero?: boolean
}

export default function StorefrontLayout({ children }: StorefrontLayoutProps) {
  // state for mobile menu - the sacred drawer controller
  const [open, setOpen] = useState(false)
  
  // get that featured products data straight from vendure - no more static nonsense
  const { products: featuredProducts, loading: productsLoading } = useFeaturedProducts(3)

  // If children are provided, render a simple layout with just header and footer
  if (children) {
    return (
      <div className="bg-white">
        {/* Mobile menu - slides out when summoned */}
        <MobileMenu open={open} setOpen={setOpen} navigation={navigation} />

        {/* Cart drawer - slide out cart */}
        <CartDrawer />

        <header className="relative">
          {/* Top navigation - where the nav magic happens */}
          <NavigationHeader navigation={navigation} setOpen={setOpen} />
        </header>

        <main>{children}</main>

        {/* Footer - the grand finale */}
        <Footer navigation={footerNavigation} />
      </div>
    )
  }

  // Default homepage layout
  return (
    <div className="bg-white">
      {/* Mobile menu - slides out when summoned */}
      <MobileMenu open={open} setOpen={setOpen} navigation={navigation} />

      {/* Cart drawer - slide out cart */}
      <CartDrawer />

      <header className="relative overflow-hidden">
        {/* Top navigation - where the nav magic happens */}
        <NavigationHeader navigation={navigation} setOpen={setOpen} />

        {/* Hero section - big energy landing */}
        <HeroSection />
      </header>

      <main>
        {/* Category section - organized chaos */}
        <CategorySection />

        {/* Featured section - sustainability vibes */}
        <FeaturedSection />

        {/* Favorites section - the certified bangers */}
        <FavoritesSection favorites={featuredProducts} loading={productsLoading} />

        {/* CTA section - FOMO generator */}
        <CTASection />
      </main>

      {/* Footer - the goodbye but also hello to your inbox */}
      <Footer navigation={footerNavigation} />
    </div>
  )
}
