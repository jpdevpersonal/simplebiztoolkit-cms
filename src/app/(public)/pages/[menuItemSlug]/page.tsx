/**
 * Menu Item landing page – shows categories belonging to a menu item.
 * If the menu item has no categories, shows its direct pages directly.
 * Mirrors /products/[categorySlug] pattern.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { sanitizeHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slugify";
import {
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createPageMetadata,
  normalizePublicUrl,
} from "@/lib/seo";
import "@/styles/contentCards.css";
import "@/styles/pages.css";

type Props = {
  params: Promise<{ menuItemSlug: string }>;
};

export const revalidate = 300;

/** Resolve a menu item by matching slugified title against the URL slug. */
async function resolveMenuItem(slug: string) {
  const items = await getPublishedMenuItems();
  return items.find((i) => slugify(i.title) === slug);
}

export async function generateStaticParams() {
  return (await getPublishedMenuItems()).map((i) => ({
    menuItemSlug: slugify(i.title),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { menuItemSlug } = await params;
  const item = await resolveMenuItem(menuItemSlug);
  if (!item) return {};
  return createPageMetadata({
    title: item.title,
    description: item.description || `Browse ${item.title} pages.`,
    pathname: `/pages/${menuItemSlug}`,
  });
}

export default async function MenuItemLandingPage({ params }: Props) {
  const { menuItemSlug } = await params;
  const item = await resolveMenuItem(menuItemSlug);
  if (!item) notFound();

  const content = await getPublishedMenuItemContent(item);
  const publishedCats = content.publishedCategories;
  const directPages = content.directPages;
  const showDirectPageCards = directPages.length > 0;

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: item.title, href: `/pages/${menuItemSlug}` },
  ]);
  const collectionJsonLd = createCollectionPageJsonLd({
    name: item.title,
    description: item.description || `Browse ${item.title} pages.`,
    href: `/pages/${menuItemSlug}`,
  });
  const topicName = item.title?.trim();
  const viewTopicLabel = topicName ? `View ${topicName}` : "View all";

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

  const openContentIcon = (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 17L17 7M9 7h8v8"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const formatPageDate = (dateISO?: string) => {
    if (!dateISO) return null;
    const parsedDate = new Date(dateISO);
    if (Number.isNaN(parsedDate.getTime())) return dateISO;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(parsedDate);
  };

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="pages-header">
            <h1>{item.title}</h1>
            {item.description && (
              <div
                className="pages-header-richtext"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(item.description),
                }}
              />
            )}
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
                          {viewTopicLabel} {arrowIcon}
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
              {showDirectPageCards ? (
                <div className="row g-3 mt-2">
                  {directPages.map((page) => {
                    const imageSrc =
                      normalizePublicUrl(page.featuredImage) ??
                      normalizePublicUrl(page.headerImage);
                    const pageDate = formatPageDate(page.dateISO);

                    return (
                      <div className="col-lg-6" key={page.id}>
                        <Link
                          href={`/${page.slug}`}
                          className="sb-content-link d-block h-100 text-reset text-decoration-none"
                          aria-label={`Open ${page.title}`}
                        >
                          <article className="sb-card p-3 h-100">
                            {imageSrc && (
                              <div className="content-card-image">
                                <Image
                                  src={imageSrc}
                                  alt={page.title}
                                  width={800}
                                  height={450}
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  loading="lazy"
                                  style={{
                                    width: "100%",
                                    height: "auto",
                                    borderRadius: "8px",
                                    marginBottom: "12px",
                                    objectFit: "cover",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                />
                              </div>
                            )}

                            <div className="d-flex justify-content-between gap-2 flex-wrap">
                              <div
                                className="sb-muted"
                                style={{ fontSize: 13 }}
                              >
                                {/* {page.category || item.title} */}
                              </div>
                            </div>

                            <div
                              className="mt-1"
                              style={{ fontWeight: 900, fontSize: 18 }}
                            >
                              {page.title}
                            </div>

                            {(page.description || page.subtitle) && (
                              <div className="sb-muted mt-1">
                                {page.description || page.subtitle}
                              </div>
                            )}

                            {pageDate && (
                              <div
                                className="sb-muted"
                                style={{ fontSize: 13, marginTop: "8px" }}
                              >
                                {pageDate}
                              </div>
                            )}

                            <div className="mt-3 d-flex justify-content-end text-success">
                              {openContentIcon}
                            </div>
                          </article>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pages-grid">
                  {directPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/${page.slug}`}
                      className="page-card-link"
                      aria-label={`Open ${page.title}`}
                    >
                      <article className="page-card">
                        <h2 className="page-card-title">{page.title}</h2>
                        {page.description && (
                          <p className="page-card-summary">
                            {page.description}
                          </p>
                        )}
                        <span
                          className="page-card-cta text-success"
                          aria-hidden="true"
                          style={{ fontSize: "1.2rem" }}
                        >
                          {openContentIcon}
                        </span>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
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
