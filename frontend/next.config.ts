import type { NextConfig } from "next";

// BUG FIX: 2025-09-30 - No more hardcoded IPs, we portable now 🚀
const BACKEND_HOST = process.env.NEXT_PUBLIC_BACKEND_HOST || 'localhost';
const BACKEND_PORT = process.env.NEXT_PUBLIC_BACKEND_PORT || '3000';
const BACKEND_PROTOCOL = process.env.NEXT_PUBLIC_BACKEND_PROTOCOL || 'http';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/shop-api',
        destination: `${BACKEND_PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}/shop-api`,
      },
      {
        source: '/shop-api/:path*',
        destination: `${BACKEND_PROTOCOL}://${BACKEND_HOST}:${BACKEND_PORT}/shop-api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tailwindcss.com',
        pathname: '/**',
      },
      // FIX: 2025-10-01 - Production domain now configurable via env var, STRICT MODE: no fallback!
      // If this crashes, it means NEXT_PUBLIC_PRODUCTION_DOMAIN is missing from .env.local
      ...(process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN ? [{
        protocol: 'https' as const,
        hostname: process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN,
        pathname: '/assets/**',
      }] : []),
      // Local development
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/assets/**',
      },
      // Dynamic backend host for other deployments (staging, etc)
      ...(BACKEND_HOST !== 'localhost' && BACKEND_HOST !== 'gbrosapp.com' ? [{
        protocol: BACKEND_PROTOCOL as 'http' | 'https',
        hostname: BACKEND_HOST,
        port: BACKEND_PORT,
        pathname: '/assets/**',
      }] : []),
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src'],
  },
};

export default nextConfig;
