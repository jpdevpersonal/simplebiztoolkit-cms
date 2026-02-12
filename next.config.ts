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
    // Proxy API requests to the backend, but exclude NextAuth endpoints
    // so they are handled by the Next app itself.
    return [
      {
        // Match any /api/* path that does NOT start with /api/auth
        source: "/api/:path((?!auth/).*)",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path`,
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
