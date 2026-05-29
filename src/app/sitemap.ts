import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { featuredProducts } from "@/data/featured";
import {
  getMenuItemLandingHref,
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import { getApiService } from "@/lib/api";
import { normalizePublicUrl, toAbsoluteUrl } from "@/lib/seo";
import { toSitemapLastModified } from "@/lib/sitemap";
import { slugify } from "@/lib/slugify";
import { toTemplatesRoute } from "@/lib/templatesRoute";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const api = getApiService();
  const [productsResp, menuItems] = await Promise.all([
    api.getProductCategories(),
    getPublishedMenuItems(),
  ]);

  const categories = productsResp.data ?? [];
  const menuContent = await Promise.all(
    menuItems.map((item) => getPublishedMenuItemContent(item)),
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now },
    { url: `${site.url}/templates`, lastModified: now },
    { url: `${site.url}/pages`, lastModified: now },
    { url: `${site.url}/about`, lastModified: now },
    { url: `${site.url}/testimonials`, lastModified: now },
    { url: `${site.url}/faq`, lastModified: now },
    { url: `${site.url}/contact`, lastModified: now },
    { url: `${site.url}/free`, lastModified: now },
    { url: `${site.url}/tools/csv-profit-calculator`, lastModified: now },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/templates/${c.slug}`,
    lastModified: now,
  }));

  // product detail routes: flatten all category items and use their productPageUrl
  const productRoutes: MetadataRoute.Sitemap = categories
    .flatMap((c) => c.items || [])
    .flatMap((p) => {
      const productUrl = toTemplatesRoute(p.productPageUrl);
      return productUrl
        ? [
            {
              url: `${site.url}${productUrl}`,
              lastModified: now,
            },
          ]
        : [];
    });

  const featuredProductRoutes: MetadataRoute.Sitemap = featuredProducts.map(
    (p) => ({
      url: `${site.url}${toTemplatesRoute(p.productPageUrl) ?? p.productPageUrl}`,
      lastModified: now,
    }),
  );

  const menuLandingRoutes: MetadataRoute.Sitemap = menuContent
    .filter((item) => item.totalPages > 0)
    .map((item) => ({
      url: toAbsoluteUrl(getMenuItemLandingHref(item)),
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
    .map((page) => {
      const lastModified = toSitemapLastModified(
        page.dateModified,
        page.dateISO,
      );
      const pageHref = normalizePublicUrl(page.canonicalUrl) ?? `/${page.slug}`;

      return {
        url: toAbsoluteUrl(pageHref),
        ...(lastModified ? { lastModified } : {}),
      };
    });

  const allRoutes = [
    ...staticRoutes,
    ...categoryRoutes,
    ...productRoutes,
    ...featuredProductRoutes,
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
