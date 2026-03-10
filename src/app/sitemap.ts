import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { featuredProducts } from "@/data/featured";
import {
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import { getApiService, Article } from "@/lib/api";
import { toAbsoluteUrl } from "@/lib/seo";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const api = getApiService();
  const [productsResp, articlesResp, menuItems] = await Promise.all([
    api.getAllProducts(),
    api.getArticles(),
    getPublishedMenuItems(),
  ]);

  const categories = productsResp.data ?? [];
  const posts = articlesResp.data ?? [];
  const menuContent = await Promise.all(
    menuItems.map((item) => getPublishedMenuItemContent(item)),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now },
    { url: `${site.url}/products`, lastModified: now },
    { url: `${site.url}/blog`, lastModified: now },
    { url: `${site.url}/pages`, lastModified: now },
    { url: `${site.url}/about`, lastModified: now },
    { url: `${site.url}/testimonials`, lastModified: now },
    { url: `${site.url}/faq`, lastModified: now },
    { url: `${site.url}/help`, lastModified: now },
    { url: `${site.url}/contact`, lastModified: now },
    { url: `${site.url}/free`, lastModified: now },
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
    url: toAbsoluteUrl(p.canonicalUrl || `/blog/${p.slug}`),
    lastModified: (p.dateISO as string) || now,
  }));

  const menuLandingRoutes: MetadataRoute.Sitemap = menuContent
    .filter((item) => item.totalPages > 0)
    .filter(
      (item) =>
        !(
          item.publishedCategories.length === 0 && item.directPages.length === 1
        ),
    )
    .map((item) => ({
      url: `${site.url}/pages/${slugify(item.title)}`,
      lastModified: now,
    }));

  const menuCategoryRoutes: MetadataRoute.Sitemap = menuContent.flatMap(
    (item) =>
      item.publishedCategories.map((category) => ({
        url: `${site.url}/pages/${slugify(item.title)}/${slugify(category.title)}`,
        lastModified: now,
      })),
  );

  const menuPageRoutes: MetadataRoute.Sitemap = menuContent
    .flatMap((item) => [
      ...item.directPages,
      ...item.publishedCategories.flatMap(
        (category) => category.publishedPages,
      ),
    ])
    .map((page) => ({
      url: toAbsoluteUrl(page.canonicalUrl || `/${page.slug}`),
      lastModified: page.dateModified || page.dateISO || now,
    }));

  const allRoutes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...featuredProductRoutes,
    ...blogRoutes,
    ...menuLandingRoutes,
    ...menuCategoryRoutes,
    ...menuPageRoutes,
  ];

  const uniqueRoutes = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const route of allRoutes) {
    uniqueRoutes.set(route.url, route);
  }

  return Array.from(uniqueRoutes.values());
}
