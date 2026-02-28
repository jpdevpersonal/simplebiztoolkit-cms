/**
 * Menu Item landing page – shows categories belonging to a menu item.
 * If the menu item has no categories, shows its direct pages directly.
 * Mirrors /products/[categorySlug] pattern.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { apiService } from "@/lib/api";
import { site } from "@/config/site";
import { slugify } from "@/lib/slugify";
import "@/styles/pages.css";

type Props = {
  params: Promise<{ menuItemSlug: string }>;
};

/** Resolve a menu item by matching slugified title against the URL slug. */
async function resolveMenuItem(slug: string) {
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }
  const items = (menuRes.data ?? []).filter((i) => i.status === "published");
  return items.find((i) => slugify(i.title) === slug);
}

export async function generateStaticParams() {
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }
  return (menuRes.data ?? [])
    .filter((i) => i.status === "published")
    .map((i) => ({ menuItemSlug: slugify(i.title) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { menuItemSlug } = await params;
  const item = await resolveMenuItem(menuItemSlug);
  if (!item) return {};
  return {
    title: item.title,
    description: item.description || `Browse ${item.title} pages.`,
    alternates: { canonical: `/pages/${menuItemSlug}` },
    openGraph: {
      title: `${item.title} | ${site.name}`,
      description: item.description || `Browse ${item.title} pages.`,
      url: `/pages/${menuItemSlug}`,
    },
  };
}

export default async function MenuItemLandingPage({ params }: Props) {
  const { menuItemSlug } = await params;
  const item = await resolveMenuItem(menuItemSlug);
  if (!item) notFound();

  const publishedCats = (item.categories ?? [])
    .filter((c) => c.status === "published")
    .map((c) => ({
      ...c,
      publishedPages: (c.pages ?? []).filter((p) => p.status === "published"),
    }))
    .filter((c) => c.publishedPages.length > 0);

  const directPages = (item.pages ?? []).filter(
    (p) => p.status === "published",
  );

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
            <Link href="/pages" className="sb-breadcrumb-link">
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
              All Pages
            </Link>
          </nav>

          <div className="pages-header">
            <h1>{item.title}</h1>
            {item.description && <p className="sb-muted">{item.description}</p>}
          </div>

          {/* Categories grid */}
          {publishedCats.length > 0 && (
            <>
              <div className="pages-grid">
                {publishedCats.map((cat) => {
                  const catSlug = slugify(cat.title);
                  return (
                    <Link
                      key={cat.id}
                      href={`/pages/${menuItemSlug}/${catSlug}`}
                      className="page-card-link"
                    >
                      <article className="page-card">
                        <h2 className="page-card-title">{cat.title}</h2>
                        {cat.description && (
                          <p className="page-card-summary">{cat.description}</p>
                        )}
                        <div className="page-card-meta">
                          <span>
                            {cat.publishedPages.length} page
                            {cat.publishedPages.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <span className="page-card-cta">
                          View pages {arrowIcon}
                        </span>
                      </article>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* Direct pages (no category) */}
          {directPages.length > 0 && (
            <>
              {publishedCats.length > 0 && (
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    marginTop: "2.5rem",
                    marginBottom: "1rem",
                  }}
                >
                  Other Pages
                </h2>
              )}
              <div className="pages-grid">
                {directPages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/${page.slug}`}
                    className="page-card-link"
                  >
                    <article className="page-card">
                      <h2 className="page-card-title">{page.title}</h2>
                      {page.description && (
                        <p className="page-card-summary">{page.description}</p>
                      )}
                      <span className="page-card-cta">
                        Read page {arrowIcon}
                      </span>
                    </article>
                  </Link>
                ))}
              </div>
            </>
          )}

          {publishedCats.length === 0 && directPages.length === 0 && (
            <div className="pages-empty">
              <h2>No content available yet</h2>
              <p>Check back soon for new pages.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
