import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cms", "/cms/*", "/admin", "/admin/*", "/api", "/api/*"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
