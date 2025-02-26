import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
};

export default nextConfig;
