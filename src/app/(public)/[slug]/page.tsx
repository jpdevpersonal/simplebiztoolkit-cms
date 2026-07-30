import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { slugify } from "@/lib/slugify";
import Image from "next/image";
import { ContentRenderer } from "@/components/ContentRenderer";
import "@/styles/bootstrap-public-components.scss";
import { apiService } from "@/lib/api";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import {
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  createPageMetadata,
  normalizePublicUrl,
} from "@/lib/seo";
import "@/styles/contentPage.css";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

/**
 * Generate static params for ISR – pre-renders published menu item pages at
 * build time (same pattern as other public CMS pages).
 */
export async function generateStaticParams() {
  const response = await apiService.getMenuItemPages();
  if (!response.data) return [];

  return response.data
    .filter((p) => p.status === "published")
    .map((p) => ({ slug: p.slug }));
}

/**
 * Generate SEO metadata for each menu item page.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const response = await apiService.getMenuItemPageBySlug(slug);
  if (!response.data) return {};

  const page = response.data;
  const headerImage = normalizePublicUrl(page.headerImage);
  const ogImage =
    normalizePublicUrl(page.ogImage) ??
    normalizePublicUrl(page.featuredImage) ??
    headerImage;

  return createPageMetadata({
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.description,
    pathname: `/${page.slug}`,
    canonical: page.canonicalUrl || undefined,
    image: ogImage || undefined,
    openGraphType: "website",
  });
}

/**
 * Public-facing page for CMS menu item pages.
 *
 * Menu item pages are linked from the site navigation as `/${page.slug}`.
 * This dynamic route catches those slugs and renders the page content,
 * mirroring the behaviour of other public CMS content pages.
 */
export default async function MenuItemPageView({ params }: Props) {
  const { slug } = await params;
  const response = await apiService.getMenuItemPageBySlug(slug);

  if (!response.data) notFound();

  const page = response.data;
  const headerImage = normalizePublicUrl(page.headerImage);

  let parentCategory = page.menuCategory;
  if (
    page.menuCategoryId &&
    (!parentCategory || !parentCategory.menuItemId || !parentCategory.title)
  ) {
    const categoryResponse = await apiService.getMenuCategoryById(
      page.menuCategoryId,
    );
    if (categoryResponse.data) {
      parentCategory = parentCategory
        ? { ...categoryResponse.data, ...parentCategory }
        : categoryResponse.data;
    }
  }

  // Resolve parent menu item for breadcrumb (may be provided inline or referenced by id)
  let parentMenuItem = page.menuItem ?? parentCategory?.menuItem;
  if (!parentMenuItem && page.menuItemId) {
    const menuItemResponse = await apiService.getMenuItemById(page.menuItemId);
    parentMenuItem = menuItemResponse.data;
  }
  if (!parentMenuItem && parentCategory?.menuItemId) {
    const menuItemResponse = await apiService.getMenuItemById(
      parentCategory.menuItemId,
    );
    parentMenuItem = menuItemResponse.data;
  }
  // Fallback: scan the published menu items list (same reliable source used for navigation)
  if (!parentMenuItem || (page.menuCategoryId && !parentCategory?.menuItemId)) {
    const allItems = await getPublishedMenuItems();

    if (page.menuCategoryId) {
      const itemWithCategory = allItems.find((item) =>
        (item.categories ?? []).some(
          (category) => category.id === page.menuCategoryId,
        ),
      );

      if (itemWithCategory) {
        parentMenuItem ??= itemWithCategory;
        const matchedCategory = (itemWithCategory.categories ?? []).find(
          (category) => category.id === page.menuCategoryId,
        );

        if (matchedCategory) {
          parentCategory = parentCategory
            ? { ...matchedCategory, ...parentCategory }
            : matchedCategory;
        }
      }
    }

    if (!parentMenuItem) {
      const targetId = page.menuItemId ?? parentCategory?.menuItemId;
      if (targetId) {
        parentMenuItem = allItems.find((item) => item.id === targetId);
      }
    }
  }

  const breadcrumbItems = [{ name: "Home", href: "/" }];
  const parentMenuItemSlug = parentMenuItem
    ? slugify(parentMenuItem.title)
    : null;

  if (parentMenuItem && parentMenuItemSlug) {
    breadcrumbItems.push({
      name: parentMenuItem.title,
      href: `/pages/${parentMenuItemSlug}`,
    });
  }

  if (parentCategory && parentMenuItemSlug) {
    breadcrumbItems.push({
      name: parentCategory.title,
      href: `/pages/${parentMenuItemSlug}/${slugify(parentCategory.title)}`,
    });
  }

  breadcrumbItems.push({ name: page.title, href: `/${page.slug}` });

  // Hide breadcrumb when this page is the sole direct page of its menu item
  // (no topics, single page — menu links straight here).
  let isStandaloneMenuPage = false;
  if (parentMenuItem && !page.menuCategoryId) {
    const parentContent = await getPublishedMenuItemContent(parentMenuItem);
    isStandaloneMenuPage =
      parentContent.publishedCategories.length === 0 &&
      parentContent.directPages.length === 1;
  }

  const pageJsonLd = createArticleJsonLd({
    headline: page.title,
    description: page.seoDescription ?? page.description,
    href: page.canonicalUrl ?? `/${page.slug}`,
    datePublished: page.dateISO,
    dateModified: page.dateModified,
    image: headerImage ?? normalizePublicUrl(page.featuredImage),
    wordCount: page.content
      ? page.content
          .replace(/<[^>]+>/g, " ")
          .trim()
          .split(/\s+/).length
      : undefined,
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems);

  const lastUpdatedDate = page.dateModified ?? page.dateISO;
  const lastUpdatedLabel = lastUpdatedDate
    ? new Date(lastUpdatedDate).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={pageJsonLd} />

      <div
        className={`content-page${isStandaloneMenuPage ? " content-page--standalone" : ""}`}
      >
        {!isStandaloneMenuPage && <SiteBreadcrumb items={breadcrumbItems} />}

        <header className="content-header">
          <h1 className="content-title">{page.title}</h1>
          {page.subtitle && <p className="content-subtitle">{page.subtitle}</p>}
          {lastUpdatedLabel && page.showLastUpdated !== false && (
            <p className="content-updated">
              <time dateTime={lastUpdatedDate ?? undefined}>
                Last updated {lastUpdatedLabel}
              </time>
              {" · "}By Simple Biz Toolkit
            </p>
          )}
        </header>

        {/* Header image */}
        {headerImage && (
          <div className="content-header-image">
            <Image
              src={headerImage}
              alt={page.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="lazy"
              unoptimized={shouldBypassNextImageOptimization(headerImage)}
            />
          </div>
        )}

        {/* Page content */}
        <article>
          <ContentRenderer html={page.content ?? ""} />
        </article>

        {!isStandaloneMenuPage && (
          <SiteBreadcrumb items={breadcrumbItems} bottom />
        )}
      </div>
    </>
  );
}
