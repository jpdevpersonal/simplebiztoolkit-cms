import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export", // Static export for Azure Static Web Apps
  trailingSlash: false,
  images: {
    unoptimized: true, // Required for Azure Static Web Apps free tier
  },
  // Note: redirects are handled in staticwebapp.config.json for static exports
};

export default nextConfig;
