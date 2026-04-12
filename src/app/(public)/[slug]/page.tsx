import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { slugify } from "@/lib/slugify";
import Image from "next/image";
import { ContentRenderer } from "@/components/ContentRenderer";
import { apiService } from "@/lib/api";
import { getPublishedMenuItems } from "@/lib/menuContent";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createWebPageJsonLd,
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
  const ogImage = page.ogImage || page.featuredImage || page.headerImage;

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

  let parentCategory = page.menuCategory;
  if (!parentCategory && page.menuCategoryId) {
    const categoryResponse = await apiService.getMenuCategoryById(
      page.menuCategoryId,
    );
    parentCategory = categoryResponse.data;
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
  if (!parentMenuItem) {
    const targetId = page.menuItemId ?? parentCategory?.menuItemId;
    if (targetId) {
      const allItems = await getPublishedMenuItems();
      parentMenuItem = allItems.find((i) => i.id === targetId);
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

  const pageJsonLd = createWebPageJsonLd({
    name: page.title,
    description: page.description,
    href: `/${page.slug}`,
    datePublished: page.dateISO,
    dateModified: page.dateModified,
    image: page.headerImage,
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={pageJsonLd} />

      <main className="content-page">
        <SiteBreadcrumb items={breadcrumbItems} />

        <header className="content-header">
          <h1 className="content-title">{page.title}</h1>
          {page.subtitle && <p className="content-subtitle">{page.subtitle}</p>}
        </header>

        {/* Header image */}
        {page.headerImage && (
          <div className="content-header-image">
            <Image
              src={page.headerImage}
              alt={page.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="lazy"
            />
          </div>
        )}

        {/* Page content */}
        <article>
          <ContentRenderer html={page.content ?? ""} />
        </article>

        <SiteBreadcrumb items={breadcrumbItems} bottom />
      </main>
    </>
  );
}
