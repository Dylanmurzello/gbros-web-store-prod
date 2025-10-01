// navigation data that's bussin with all the categories and links no cap
// keeping it organized like marie kondo but for code

import { NavigationData, FooterNavigationSection } from '@/types/storefront';

export const navigation: NavigationData = {
  categories: [
    {
      id: 'sports-awards',
      name: 'Sports Awards',
      featured: [
        {
          name: 'Championship Trophies',
          href: '/shop?category=championship',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-01.jpg',
          imageAlt: 'Premium championship trophies with custom engraving options.',
        },
        {
          name: 'Team Awards',
          href: '/shop?category=team',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/mega-menu-category-02.jpg',
          imageAlt: 'Complete team award sets for all sports.',
        },
      ],
      sections: [
        {
          id: 'by-sport',
          name: 'By Sport',
          items: [
            { name: 'Football', href: '/shop?sport=football' },
            { name: 'Basketball', href: '/shop?sport=basketball' },
            { name: 'Soccer', href: '/shop?sport=soccer' },
            { name: 'Baseball', href: '/shop?sport=baseball' },
            { name: 'Tennis', href: '/shop?sport=tennis' },
            { name: 'Golf', href: '/shop?sport=golf' },
            { name: 'Track & Field', href: '/shop?sport=track' },
            { name: 'Swimming', href: '/shop?sport=swimming' },
            { name: 'Browse All', href: '/shop' },
          ],
        },
        {
          id: 'award-types',
          name: 'Award Types',
          items: [
            { name: 'Trophies', href: '/shop?type=trophies' },
            { name: 'Medals', href: '/shop?type=medals' },
            { name: 'Plaques', href: '/shop?type=plaques' },
            { name: 'Ribbons', href: '/shop?type=ribbons' },
            { name: 'Certificates', href: '/shop?type=certificates' },
            { name: 'Custom Awards', href: '/shop?type=custom' },
          ],
        },
        {
          id: 'occasions',
          name: 'Occasions',
          items: [
            { name: 'Championships', href: '/shop?occasion=championship' },
            { name: 'Tournaments', href: '/shop?occasion=tournament' },
            { name: 'MVP Awards', href: '/shop?occasion=mvp' },
            { name: 'Participation', href: '/shop?occasion=participation' },
            { name: 'Season Awards', href: '/shop?occasion=season' },
          ],
        },
      ],
    },
    {
      id: 'corporate-awards',
      name: 'Corporate Awards',
      featured: [
        {
          name: 'Employee Recognition',
          href: '/shop?category=employee',
          imageSrc:
            'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-04-detail-product-shot-01.jpg',
          imageAlt: 'Elegant crystal awards for employee recognition.',
        },
        {
          name: 'Achievement Plaques',
          href: '/shop?category=achievement',
          imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/category-page-02-image-card-06.jpg',
          imageAlt:
            'Professional wooden and metal plaques for corporate achievements.',
        },
      ],
      sections: [
        {
          id: 'recognition',
          name: 'Recognition',
          items: [
            { name: 'Employee of the Month', href: '/shop?award=employee-month' },
            { name: 'Years of Service', href: '/shop?award=service' },
            { name: 'Sales Achievement', href: '/shop?award=sales' },
            { name: 'Leadership Awards', href: '/shop?award=leadership' },
            { name: 'Team Excellence', href: '/shop?award=team' },
            { name: 'Innovation Awards', href: '/shop?award=innovation' },
            { name: 'Browse All', href: '/shop' },
          ],
        },
        {
          id: 'materials',
          name: 'Materials',
          items: [
            { name: 'Crystal', href: '/shop?material=crystal' },
            { name: 'Glass', href: '/shop?material=glass' },
            { name: 'Metal', href: '/shop?material=metal' },
            { name: 'Wood', href: '/shop?material=wood' },
            { name: 'Acrylic', href: '/shop?material=acrylic' },
            { name: 'Marble', href: '/shop?material=marble' },
          ],
        },
        {
          id: 'customization',
          name: 'Customization',
          items: [
            { name: 'Logo Engraving', href: '/shop?custom=logo' },
            { name: 'Custom Shapes', href: '/shop?custom=shapes' },
            { name: '3D Designs', href: '/shop?custom=3d' },
            { name: 'Full Color Printing', href: '/shop?custom=color' },
          ],
        },
      ],
    },
  ],
    pages: [
      { name: 'Shop', href: '/shop' }, // Core navigation - always visible
      // About & Contact pages will appear dynamically when visited (macOS dock style)
    ],
};

// Static favorites removed - now using dynamic data from Vendure API via useFeaturedProducts hook

export const footerNavigation: FooterNavigationSection = {
  shop: [
    { name: 'Trophies', href: '/shop?type=trophies' },
    { name: 'Plaques', href: '/shop?type=plaques' },
    { name: 'Medals', href: '/shop?type=medals' },
    { name: 'Custom Awards', href: '/shop?type=custom' },
    { name: 'Engraving Services', href: '#' },
  ],
  company: [
    { name: 'About Gbros', href: '/about' }, // UPDATED: 2025-09-26 - Connected to new About page
    { name: 'Our Craftsmanship', href: '#' },
    { name: 'Testimonials', href: '#' },
    { name: 'Bulk Orders', href: '#' },
    { name: 'Terms & Conditions', href: '#' },
    { name: 'Privacy Policy', href: '#' },
  ],
  account: [
    { name: 'Track Order', href: '#' },
    { name: 'Design Studio', href: '#' },
    { name: 'Quote Request', href: '/contact' }, // UPDATED: 2025-09-26 - Connected to contact form for trophy quotes
  ],
  connect: [
    { name: 'Contact Us', href: '/contact' }, // UPDATED: 2025-09-26 - Connected to new Contact page
    { name: 'Carson Showroom', href: '#' },
    { name: 'Instagram', href: '#' },
    { name: 'LinkedIn', href: '#' },
  ],
};
