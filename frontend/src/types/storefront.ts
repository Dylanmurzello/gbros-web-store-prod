// yo these are the type definitions for the storefront, keeping it type-safe fr fr

export interface FeaturedItem {
  name: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

export interface NavigationItem {
  name: string;
  href: string;
}

export interface NavigationSection {
  id: string;
  name: string;
  items: NavigationItem[];
}

export interface NavigationCategory {
  id: string;
  name: string;
  featured: FeaturedItem[];
  sections: NavigationSection[];
}

export interface NavigationPage {
  name: string;
  href: string;
}

export interface NavigationData {
  categories: NavigationCategory[];
  pages: NavigationPage[];
}

export interface Product {
  id: number;
  name: string;
  price: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

export interface FooterNavigationSection {
  [key: string]: NavigationItem[];
}
