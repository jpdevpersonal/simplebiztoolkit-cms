import type { MetadataRoute } from "next";
import { site } from "@/config/site";
// local fallback data files removed; use API with empty fallbacks
import { featuredProducts } from "@/data/featured";
import { getApiService, Article } from "@/lib/api";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Fetch products and posts from the central API; fall back to local data on error
  const api = getApiService();
  const [productsResp, articlesResp] = await Promise.all([
    api.getAllProducts(),
    api.getArticles(),
  ]);

  const categories = productsResp.data ?? [];
  const posts = articlesResp.data ?? [];

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now },
    { url: `${site.url}/products`, lastModified: now },
    { url: `${site.url}/blog`, lastModified: now },
    { url: `${site.url}/about`, lastModified: now },
    { url: `${site.url}/testimonials`, lastModified: now },
    { url: `${site.url}/faq`, lastModified: now },
    { url: `${site.url}/help`, lastModified: now },
    { url: `${site.url}/contact`, lastModified: now },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/products/${c.slug}`,
    lastModified: now,
  }));

  // product detail routes: flatten all category items and use their productPageUrl
  const productRoutes: MetadataRoute.Sitemap = categories
    .flatMap((c) => c.items || [])
    .map((p) => ({
      url: `${site.url}${p.productPageUrl}`,
      lastModified: now,
    }));

  const featuredProductRoutes: MetadataRoute.Sitemap = featuredProducts.map(
    (p) => ({
      url: `${site.url}${p.productPageUrl}`,
      lastModified: now,
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = posts.map((p: Article) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: (p.dateISO as string) || now,
  }));

  const allRoutes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...featuredProductRoutes,
    ...blogRoutes,
  ];

  const uniqueRoutes = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const route of allRoutes) {
    uniqueRoutes.set(route.url, route);
  }

  return Array.from(uniqueRoutes.values());
}
