import type { MetadataRoute } from "next";
import { featureFlags } from "@/config/featureFlags";
import { site } from "@/config/site";
import { featuredProducts } from "@/data/featured";
import {
  getMenuItemLandingHref,
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import { getApiService } from "@/lib/api";
import { toAbsoluteUrl } from "@/lib/seo";
import {
  toLatestSitemapLastModified,
  toSitemapLastModified,
} from "@/lib/sitemap";
import { slugify } from "@/lib/slugify";
import { toTemplatesRoute } from "@/lib/templatesRoute";

export const revalidate = 3600;

type DatedPage = {
  dateISO?: string | null;
  dateModified?: string | null;
};

function getPageDateCandidates(
  pages: DatedPage[],
): Array<string | null | undefined> {
  return pages.flatMap((page) => [page.dateModified, page.dateISO]);
}

function createSitemapEntry(
  url: string,
  ...lastModifiedCandidates: Array<Date | string | null | undefined>
): MetadataRoute.Sitemap[number] {
  const lastModified = toLatestSitemapLastModified(...lastModifiedCandidates);

  return {
    url,
    ...(lastModified ? { lastModified } : {}),
  };
}

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

  const allMenuPages = menuContent.flatMap((item) => [
    ...item.directPages,
    ...item.publishedCategories.flatMap((category) => category.publishedPages),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url },
    { url: `${site.url}/templates` },
    createSitemapEntry(
      `${site.url}/pages`,
      ...getPageDateCandidates(allMenuPages),
    ),
    { url: `${site.url}/about` },
    { url: `${site.url}/testimonials` },
    { url: `${site.url}/faq` },
    { url: `${site.url}/help` },
    { url: `${site.url}/contact` },
    ...(featureFlags.showFreeGuideButton ? [{ url: `${site.url}/free` }] : []),
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/templates/${c.slug}`,
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
            },
          ]
        : [];
    });

  const featuredProductRoutes: MetadataRoute.Sitemap = featuredProducts.map(
    (p) => ({
      url: `${site.url}${toTemplatesRoute(p.productPageUrl) ?? p.productPageUrl}`,
    }),
  );

  const menuLandingRoutes: MetadataRoute.Sitemap = menuContent
    .filter((item) => item.totalPages > 0)
    .map((item) =>
      createSitemapEntry(
        toAbsoluteUrl(getMenuItemLandingHref(item)),
        ...getPageDateCandidates([
          ...item.directPages,
          ...item.publishedCategories.flatMap(
            (category) => category.publishedPages,
          ),
        ]),
      ),
    );

  const menuCategoryRoutes: MetadataRoute.Sitemap = menuContent.flatMap(
    (item) =>
      item.publishedCategories.map((category) =>
        createSitemapEntry(
          `${site.url}/pages/${slugify(item.title)}/${slugify(category.title)}`,
          ...getPageDateCandidates(category.publishedPages),
        ),
      ),
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

      return {
        url: toAbsoluteUrl(page.canonicalUrl || `/${page.slug}`),
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
