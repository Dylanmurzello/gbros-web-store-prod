# gbros-storefront

A modern e-commerce storefront built with the latest tech stack for the Vendure backend.

## Tech Stack

- **Next.js 15.5.3** - The React framework with Turbopack for blazing fast builds
- **React 19.1.0** - Latest React with all the new hooks and performance improvements
- **TypeScript 5** - Type-safe development experience
- **Tailwind CSS v4** - Utility-first CSS framework with the latest features
- **Headless UI 2.2.8** - Unstyled, accessible UI components
- **Heroicons 2.2.0** - Beautiful hand-crafted SVG icons

## Features

- 📱 Fully responsive design
- 🛍️ Product categories with mega menus
- 🎨 Modern UI with smooth transitions
- ♿ Accessible components using Headless UI
- 🚀 Optimized with Turbopack
- 🔄 Ready for Vendure backend integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# Backend Connection (for next.config.ts)
# BUG FIX: 2025-09-30 - Made backend connection configurable 🚀
NEXT_PUBLIC_BACKEND_HOST=localhost  # or your production IP/domain
NEXT_PUBLIC_BACKEND_PORT=3000
NEXT_PUBLIC_BACKEND_PROTOCOL=http   # use 'https' in production

# Google OAuth (optional)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3000/shop-api
```

**Defaults:**
- If not set, defaults to `localhost:3000` with `http` protocol
- Perfect for local development out of the box

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Development

The development server runs on [http://localhost:3001](http://localhost:3001) with hot reload enabled.

## Project Structure

```
gbros-storefront/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   ├── StorefrontLayout.tsx  # Main layout wrapper
│   │   ├── MobileMenu.tsx        # Mobile navigation
│   │   ├── NavigationHeader.tsx  # Desktop header
│   │   ├── HeroSection.tsx       # Hero banner
│   │   ├── CategorySection.tsx   # Product categories
│   │   ├── FeaturedSection.tsx   # Featured content
│   │   ├── FavoritesSection.tsx  # Featured products
│   │   ├── CTASection.tsx        # Call-to-action
│   │   └── Footer.tsx            # Site footer
│   ├── data/             # Static data
│   │   └── navigation.ts # Navigation structure
│   └── types/            # TypeScript types
│       └── storefront.ts # Component interfaces
├── public/               # Static assets
├── names-used.md         # Component naming reference
└── package.json          # Dependencies

```

## Component Reference

See [names-used.md](./names-used.md) for a complete list of components, functions, and naming conventions used throughout the codebase.

## Vendure Integration

This storefront is designed to work with a Vendure backend. Key integration points:

- GraphQL client setup (axios/graphql-request ready)
- Product data fetching
- Cart management
- User authentication
- Order processing

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT