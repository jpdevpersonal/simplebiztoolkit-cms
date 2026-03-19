import type { NextConfig } from "next";
import path from "path";

const isProd = process.env.NODE_ENV === "production";

function normalizeConfiguredApiUrl(base?: string): string {
  if (!base) {
    return "";
  }

  const trimmedBase = base.trim().replace(/\/+$/, "");
  return trimmedBase.endsWith("/api")
    ? trimmedBase.slice(0, -"/api".length)
    : trimmedBase;
}

// Content-Security-Policy — blocks inline scripts except those Next.js needs,
// external script hosts, and forbids framing (belt-and-suspenders with
// X-Frame-Options below).
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://www.simplebiztoolkit.com blob:;
  font-src 'self';
  connect-src 'self' ${isProd ? "https://www.simplebiztoolkit.com" : "http://localhost:5117"};
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const remotePatterns: { protocol: "http" | "https"; hostname: string }[] = [
  {
    protocol: "https",
    hostname: "simplebiztoolkit.com",
  },
];

// In development allow images from localhost (never expose to production)
if (!isProd) {
  remotePatterns.push({ protocol: "http", hostname: "localhost" });
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // REMOVED: output: 'export' - Now using dynamic mode with ISR
  trailingSlash: false,

  // isomorphic-dompurify and jsdom use fs.readFileSync internally —
  // they must not be bundled by webpack/turbopack.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],

  images: {
    unoptimized: false,
    remotePatterns,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async rewrites() {
    // Proxy API requests to the backend, but only when `NEXT_PUBLIC_API_URL`
    // is provided (e.g. in environments that have an upstream backend).
    // If the env var is missing, return no rewrites so Next's build doesn't
    // embed an invalid `undefined/...` destination and fail.
    const apiUrl = normalizeConfiguredApiUrl(process.env.NEXT_PUBLIC_API_URL);
    if (!apiUrl) return [];

    return [
      {
        // Match /api/* paths that do NOT start with one of the Next.js-handled prefixes.
        source:
          "/api/:path((?!auth/|products|revalidate|articles|menuitems|menucategories|menuitempages).*)",
        destination: `${apiUrl}/api/:path`,
      },
    ];
  },

  // Root used for output file tracing to avoid workspace-root inference warnings
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
