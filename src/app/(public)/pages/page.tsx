/**
 * Public Pages overview – lists published MenuItems that have content.
 * Similar to /products which lists product categories.
 */

import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import {
  getMenuItemLandingHref,
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import "@/styles/pages.css";

const pagesDescription = "Browse our content pages by topic.";

export const metadata: Metadata = createPageMetadata({
  title: "Pages",
  description: pagesDescription,
  pathname: "/pages",
});

export default async function PagesOverview() {
  const publishedItems = (
    await Promise.all(
      (await getPublishedMenuItems()).map((item) =>
        getPublishedMenuItemContent(item),
      ),
    )
  ).filter((item) => item.totalPages > 0);

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Pages", href: "/pages" },
  ]);
  const collectionJsonLd = createCollectionPageJsonLd({
    name: "Pages",
    description: pagesDescription,
    href: "/pages",
  });

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
      <JsonLd json={collectionJsonLd} />
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
                const href = getMenuItemLandingHref(item);

                return (
                  <Link href={href} className="page-card-link" key={item.id}>
                    <article className="page-card">
                      <h2 className="page-card-title">{item.title}</h2>
                      {item.description && (
                        <p className="page-card-summary">{item.description}</p>
                      )}
                      <div className="page-card-meta">
                        {item.publishedCategories.length > 0 && (
                          <span>
                            {item.publishedCategories.length} topic
                            {item.publishedCategories.length === 1 ? "" : "s"}
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
