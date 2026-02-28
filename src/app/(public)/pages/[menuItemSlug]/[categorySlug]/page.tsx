/**
 * Category page listing – shows all published pages within a category.
 * Mirrors /products/[categorySlug] which lists products in a product-category.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { apiService } from "@/lib/api";
import { site } from "@/config/site";
import { slugify } from "@/lib/slugify";
import "@/styles/pages.css";

type Props = {
  params: Promise<{ menuItemSlug: string; categorySlug: string }>;
};

/** Resolve menu item + category by their slugified titles. */
async function resolve(menuSlug: string, catSlug: string) {
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }
  const items = (menuRes.data ?? []).filter((i) => i.status === "published");
  const item = items.find((i) => slugify(i.title) === menuSlug);
  if (!item) return null;

  const cat = (item.categories ?? [])
    .filter((c) => c.status === "published")
    .find((c) => slugify(c.title) === catSlug);
  if (!cat) return null;

  const publishedPages = (cat.pages ?? []).filter(
    (p) => p.status === "published",
  );

  return { item, cat, publishedPages };
}

export async function generateStaticParams() {
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }
  const params: { menuItemSlug: string; categorySlug: string }[] = [];
  for (const item of (menuRes.data ?? []).filter(
    (i) => i.status === "published",
  )) {
    const menuSlug = slugify(item.title);
    for (const cat of (item.categories ?? []).filter(
      (c) => c.status === "published",
    )) {
      params.push({ menuItemSlug: menuSlug, categorySlug: slugify(cat.title) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { menuItemSlug, categorySlug } = await params;
  const data = await resolve(menuItemSlug, categorySlug);
  if (!data) return {};
  const { item, cat } = data;
  return {
    title: `${cat.title} – ${item.title}`,
    description: cat.description || `Browse ${cat.title} pages.`,
    alternates: {
      canonical: `/pages/${menuItemSlug}/${categorySlug}`,
    },
    openGraph: {
      title: `${cat.title} | ${item.title} | ${site.name}`,
      description: cat.description || `Browse ${cat.title} pages.`,
      url: `/pages/${menuItemSlug}/${categorySlug}`,
    },
  };
}

export default async function CategoryPageListing({ params }: Props) {
  const { menuItemSlug, categorySlug } = await params;
  const data = await resolve(menuItemSlug, categorySlug);
  if (!data) notFound();
  const { item, cat, publishedPages } = data;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: item.title,
        item: `${site.url}/pages/${menuItemSlug}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.title,
        item: `${site.url}/pages/${menuItemSlug}/${categorySlug}`,
      },
    ],
  };

  const arrowIcon = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <section className="sb-section">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="sb-breadcrumb" aria-label="Breadcrumb">
            <Link
              href={`/pages/${menuItemSlug}`}
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
              Back to {item.title}
            </Link>
          </nav>

          <div className="pages-header">
            <h1>{cat.title}</h1>
            {cat.description && <p className="sb-muted">{cat.description}</p>}
          </div>

          {publishedPages.length === 0 ? (
            <div className="pages-empty">
              <h2>No pages available yet</h2>
              <p>Check back soon for new content in this topic.</p>
            </div>
          ) : (
            <div className="pages-grid">
              {publishedPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className="page-card-link"
                >
                  <article className="page-card">
                    {page.featuredImage && (
                      <Image
                        src={page.featuredImage}
                        alt={page.title}
                        width={400}
                        height={225}
                        className="page-card-image"
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                    )}
                    <h2 className="page-card-title">{page.title}</h2>
                    {page.description && (
                      <p className="page-card-summary">{page.description}</p>
                    )}
                    {page.dateISO && (
                      <div className="page-card-meta">
                        <span>{page.dateISO}</span>
                      </div>
                    )}
                    <span className="page-card-cta">Read page {arrowIcon}</span>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
