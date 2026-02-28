/**
 * Public Pages overview – lists published MenuItems that have content.
 * Similar to /products which lists product categories.
 */

import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { apiService } from "@/lib/api";
import { site } from "@/config/site";
import { slugify } from "@/lib/slugify";
import "@/styles/pages.css";

export const metadata: Metadata = {
  title: "Pages",
  description: "Browse our content pages by topic.",
  alternates: { canonical: "/pages" },
  openGraph: {
    title: `Pages | ${site.name}`,
    description: "Browse our content pages by topic.",
    url: "/pages",
  },
};

export default async function PagesOverview() {
  // Use the tree endpoint so we get nested categories + pages
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }
  const allItems = menuRes.data ?? [];

  // Only show published items that actually have content
  const publishedItems = allItems
    .filter((i) => i.status === "published")
    .map((item) => {
      const directPages = (item.pages ?? []).filter(
        (p) => p.status === "published",
      );
      const publishedCats = (item.categories ?? [])
        .filter((c) => c.status === "published")
        .filter((c) => (c.pages ?? []).some((p) => p.status === "published"));
      const totalPages =
        directPages.length +
        publishedCats.reduce(
          (sum, c) =>
            sum +
            (c.pages ?? []).filter((p) => p.status === "published").length,
          0,
        );
      return { ...item, directPages, publishedCats, totalPages };
    })
    .filter((i) => i.totalPages > 0);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pages",
        item: `${site.url}/pages`,
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
          <div className="pages-header">
            <h1>Pages</h1>
            <p className="sb-muted">
              Browse our content pages organised by topic.
            </p>
          </div>

          {publishedItems.length === 0 ? (
            <div className="pages-empty">
              <h2>No pages available yet</h2>
              <p>Check back soon for new content.</p>
            </div>
          ) : (
            <div className="pages-grid">
              {publishedItems.map((item) => {
                const menuSlug = slugify(item.title);
                // If no categories, link directly to first page
                const href =
                  item.publishedCats.length > 0
                    ? `/pages/${menuSlug}`
                    : item.directPages.length === 1
                      ? `/${item.directPages[0].slug}`
                      : `/pages/${menuSlug}`;

                return (
                  <Link href={href} className="page-card-link" key={item.id}>
                    <article className="page-card">
                      <h2 className="page-card-title">{item.title}</h2>
                      {item.description && (
                        <p className="page-card-summary">{item.description}</p>
                      )}
                      <div className="page-card-meta">
                        {item.publishedCats.length > 0 && (
                          <span>
                            {item.publishedCats.length} categor
                            {item.publishedCats.length === 1 ? "y" : "ies"}
                          </span>
                        )}
                        <span>
                          {item.totalPages} page
                          {item.totalPages === 1 ? "" : "s"}
                        </span>
                      </div>
                      <span className="page-card-cta">
                        Browse pages {arrowIcon}
                      </span>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
