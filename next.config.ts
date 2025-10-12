import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jkprimecare.com',
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
  },
  // This is the key configuration to make all pages dynamic
  
  // Force ISR/dynamic rendering for all pages
  env: {
    // Dynamic rendering settings
    NEXT_PUBLIC_FORCE_DYNAMIC: 'true',
  }
};

export default nextConfig;
