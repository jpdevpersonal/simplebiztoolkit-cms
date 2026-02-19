import type { NextConfig } from "next";
import path from "path";

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
    // and our own API routes (products, categories, revalidate)
    // so they are handled by the Next app itself.
    return [
      {
        // Match /api/* paths that do NOT start with /api/auth, /api/products, /api/revalidate, or /api/articles
        // This ensures admin/product and admin/article endpoints are handled by the Next app
        // and can use NextAuth cookies for server-side auth instead of being proxied directly.
        source: "/api/:path((?!auth/|products|revalidate|articles).*)",
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path`,
      },
    ];
  },

  // Root used for output file tracing to avoid workspace-root inference warnings
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
