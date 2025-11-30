import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'care.jket.in',
      },
      // allow any image from the internet
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Force all pages to be dynamic instead of statically generated
  experimental: {
    serverActions: {
      allowedOrigins: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['localhost:3000'],
    },
    // Note: instrumentationHook is enabled by default in Next.js 15+
    // instrumentation.ts will be used automatically
  },
  // This is the key configuration to make all pages dynamic

  // Force ISR/dynamic rendering for all pages
  env: {
    // Dynamic rendering settings
    NEXT_PUBLIC_FORCE_DYNAMIC: 'true',
  }
};

export default nextConfig;
