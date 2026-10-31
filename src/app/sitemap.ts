import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { featuredProducts } from "@/data/featured";
import {
  getMenuItemLandingHref,
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import { getApiService } from "@/lib/api";
import {
  normalizeSameSitePublicUrl,
  toAbsoluteUrl,
} from "@/lib/seo";
import { isSitemapEligiblePath, toSitemapLastModified } from "@/lib/sitemap";
import { slugify } from "@/lib/slugify";
import { toTemplatesRoute } from "@/lib/templatesRoute";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
    { url: site.url },
    { url: `${site.url}/templates` },
    { url: `${site.url}/pages` },
    { url: `${site.url}/about` },
    { url: `${site.url}/testimonials` },
    { url: `${site.url}/faq` },
    { url: `${site.url}/contact` },
    { url: `${site.url}/tools/profit-calculator` },
    { url: `${site.url}/tools/estimate-quote-generator` },
    { url: `${site.url}/tools/csv-profit-calculator` },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/templates/${c.slug}`,
  }));

  // product detail routes: flatten all category items and use their productPageUrl
  const productRoutes: MetadataRoute.Sitemap = categories
    .flatMap((c) => c.items || [])
    .filter((product) => product.status === "published")
    .flatMap((p) => {
      const productUrl = toTemplatesRoute(p.productPageUrl);
      return productUrl
        ? [
            {
              url: `${site.url}${productUrl}`,
            },
          ]
        : [];
    });

  const featuredProductRoutes: MetadataRoute.Sitemap = featuredProducts.flatMap(
    (product) => {
      const productUrl = toTemplatesRoute(product.productPageUrl);
      return productUrl ? [{ url: `${site.url}${productUrl}` }] : [];
    },
  );

  const menuLandingRoutes: MetadataRoute.Sitemap = menuContent
    .filter((item) => item.totalPages > 0)
    .map((item) => ({
      url: toAbsoluteUrl(getMenuItemLandingHref(item)),
    }));

  const menuCategoryRoutes: MetadataRoute.Sitemap = menuContent.flatMap(
    (item) =>
      item.publishedCategories.map((category) => ({
        url: `${site.url}/pages/${slugify(item.title)}/${slugify(category.title)}`,
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
      const lastModified = toSitemapLastModified(page.dateModified);
      const pageHref =
        normalizeSameSitePublicUrl(page.canonicalUrl) ?? `/${page.slug}`;

      return {
        url: toAbsoluteUrl(pageHref),
        ...(lastModified ? { lastModified } : {}),
      };
    })
    .filter((page) => {
      const pathname = new URL(page.url).pathname;
      return isSitemapEligiblePath(pathname);
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
    try {
      const candidate = new URL(route.url);
      if (
        candidate.origin !== new URL(site.url).origin ||
        candidate.search ||
        candidate.hash ||
        !isSitemapEligiblePath(candidate.pathname)
      ) {
        continue;
      }
      candidate.pathname =
        candidate.pathname.replace(/\/+$/, "") || "/";
      uniqueRoutes.set(candidate.toString(), {
        ...route,
        url: candidate.toString(),
      });
    } catch {
      console.warn("[Sitemap] Skipping invalid URL:", route.url);
    }
  }

  return Array.from(uniqueRoutes.values());
}
