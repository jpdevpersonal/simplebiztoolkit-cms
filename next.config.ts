import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // REMOVED: output: 'export' - Now using dynamic mode with ISR
  trailingSlash: false,

  images: {
    // Enable image optimization
    unoptimized: false,
    // Support remote images from your API/storage
    remotePatterns: [
      {
        protocol: "https",
        hostname: "simplebiztoolkit.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },

  // Enable experimental features for improved ISR
  experimental: {
    // Enables on-demand revalidation
    isrMemoryCacheSize: 50 * 1024 * 1024, // 50MB
  },
};

export default nextConfig;
