import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'i.scdn.co' },
    ],
  },
  output: 'standalone',
  reactStrictMode: true,
  
};

export default nextConfig;