import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import Image from "next/image";
import { ContentRenderer } from "@/components/ContentRenderer";
import { apiService } from "@/lib/api";
import { site } from "@/config/site";
import "@/styles/articleStyle.css";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate static params for ISR – pre-renders published menu item pages at
 * build time (same pattern as blog article pages).
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

  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.description,
    alternates: { canonical: page.canonicalUrl || `/${page.slug}` },
    openGraph: {
      type: "article",
      title: `${page.title} | ${site.name}`,
      description: page.description,
      url: `/${page.slug}`,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | ${site.name}`,
      description: page.description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Public-facing page for CMS menu item pages.
 *
 * Menu item pages are linked from the site navigation as `/${page.slug}`.
 * This dynamic route catches those slugs and renders the page content,
 * mirroring the behaviour of blog article pages.
 */
export default async function MenuItemPageView({ params }: Props) {
  const { slug } = await params;
  const response = await apiService.getMenuItemPageBySlug(slug);

  if (!response.data) notFound();

  const page = response.data;

  // Resolve parent menu item for breadcrumb (may be provided inline or referenced by id)
  let parentMenuItem = page.menuItem ?? page.menuCategory?.menuItem;
  if (!parentMenuItem && page.menuItemId) {
    const mi = await apiService.getMenuItemById(page.menuItemId);
    parentMenuItem = mi.data;
  }
  if (!parentMenuItem && page.menuCategoryId) {
    const cat = await apiService.getMenuCategoryById(page.menuCategoryId);
    if (cat.data?.menuItemId) {
      const mi = await apiService.getMenuItemById(cat.data.menuItemId);
      parentMenuItem = mi.data;
    }
  }

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.title,
    description: page.description,
    datePublished: page.dateISO,
    dateModified: page.dateModified || page.dateISO,
    ...(page.headerImage
      ? {
          image: [`${site.url}${page.headerImage}`],
        }
      : {}),
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <>
      <JsonLd json={pageJsonLd} />

      <main className="article-page">
        {/* Breadcrumb back to the menu item pages listing */}
        {parentMenuItem ? (
          <nav className="sb-breadcrumb" aria-label="Breadcrumb">
            <Link
              href={`/pages/${slugify(parentMenuItem.title)}`}
              className="sb-breadcrumb-link"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="sb-breadcrumb-icon"
              >
                <path
                  d="M10 3l-5 5 5 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to {parentMenuItem.title}
            </Link>
          </nav>
        ) : null}

        <header className="article-header">
          {/* <h1 className="article-title">{page.title}</h1>
          {page.subtitle && <p className="article-subtitle">{page.subtitle}</p>} */}
        </header>

        {/* Header image */}
        {page.headerImage && (
          <div className="article-header-image">
            <Image
              src={page.headerImage}
              alt={page.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="lazy"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Page content */}
        <article>
          <ContentRenderer html={page.content ?? ""} />
        </article>
      </main>
    </>
  );
}
