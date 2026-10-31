/**
 * Menu Item landing page – shows categories belonging to a menu item.
 * If the menu item has no categories, shows its direct pages directly.
 * Mirrors /products/[categorySlug] pattern.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GuideCard from "@/components/GuideCard";
import JsonLd from "@/components/JsonLd";
import { sanitizeHtml, sanitizePublicContentHtml } from "@/lib/sanitize";
import { slugify } from "@/lib/slugify";
import {
  getPublishedMenuItemContent,
  getPublishedMenuItems,
} from "@/lib/menuContent";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import "@/styles/bootstrap-public-components.scss";
import "@/styles/contentCards.css";
import "@/styles/pages.css";
import "@/styles/guides.css";

type Props = {
  params: Promise<{ menuItemSlug: string }>;
};

export const revalidate = 300;

/** Resolve a menu item by matching slugified title against the URL slug. */
async function resolveMenuItem(slug: string) {
  const items = await getPublishedMenuItems();
  return items.find((i) => slugify(i.title) === slug);
}

function namespaceToolContentHtml(html: string, pageId: string) {
  const prefix = `tool-${pageId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const idMap = new Map<string, string>();
  const withNamespacedIds = html.replace(
    /\bid=(['"])([^'"]+)\1/g,
    (_match, quote: string, id: string) => {
      const namespacedId = `${prefix}-${id}`;
      idMap.set(id, namespacedId);
      return `id=${quote}${namespacedId}${quote}`;
    },
  );

  return withNamespacedIds
    .replace(
      /\b(aria-labelledby|aria-describedby|aria-controls)=(['"])([^'"]+)\2/g,
      (_match, attr: string, quote: string, value: string) => {
        const namespacedRefs = value
          .split(/\s+/)
          .map((id) => idMap.get(id) ?? id)
          .join(" ");
        return `${attr}=${quote}${namespacedRefs}${quote}`;
      },
    )
    .replace(
      /\bhref=(['"])#([^'"]+)\1/g,
      (match, quote: string, id: string) => {
        const namespacedId = idMap.get(id);
        return namespacedId ? `href=${quote}#${namespacedId}${quote}` : match;
      },
    );
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
  const showToolContentCards = menuItemSlug === "tools";
  const isGuides = menuItemSlug === "guides";

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

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className={`pages-header${isGuides ? " sb-guides-header" : ""}`}>
            {isGuides && (
              <span className="sb-section-eyebrow">Free business guides</span>
            )}
            <h1>{item.title}</h1>
            {item.description ? (
              <div
                className="pages-header-richtext"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(item.description),
                }}
              />
            ) : (
              isGuides && (
                <p>
                  Practical, plain-English guides to help you track your money,
                  save time and run a calmer small business.
                </p>
              )
            )}
            {isGuides && directPages.length > 0 && (
              <p className="sb-guides-count">
                {directPages.length} guide
                {directPages.length === 1 ? "" : "s"} · Free to read
              </p>
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
              {showToolContentCards ? (
                <div className="tools-content-grid mt-2">
                  {directPages.map((page) => {
                    const contentHtml = sanitizePublicContentHtml(
                      page.content ?? "",
                    ).trim();
                    const toolContentHtml = contentHtml
                      ? namespaceToolContentHtml(contentHtml, page.id)
                      : "";

                    return (
                      <article className="tool-content-card" key={page.id}>
                        {toolContentHtml ? (
                          <div
                            className="tool-content-card-body"
                            dangerouslySetInnerHTML={{
                              __html: toolContentHtml,
                            }}
                          />
                        ) : (
                          <Link
                            href={`/${page.slug}`}
                            className="page-card-link"
                            aria-label={`Open ${page.title}`}
                          >
                            <div className="page-card">
                              <h2 className="page-card-title">{page.title}</h2>
                              {(page.description || page.subtitle) && (
                                <p className="page-card-summary">
                                  {page.description || page.subtitle}
                                </p>
                              )}
                              <span className="page-card-cta">
                                Open tool {arrowIcon}
                              </span>
                            </div>
                          </Link>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : showDirectPageCards ? (
                <div
                  className={`sb-guide-grid${directPages.length >= 3 ? " has-featured" : ""}`}
                >
                  {directPages.map((page, index) => (
                    <GuideCard
                      key={page.id}
                      page={page}
                      featured={directPages.length >= 3 && index === 0}
                    />
                  ))}
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

          {isGuides && directPages.length > 0 && (
            <aside className="sb-guides-cta">
              <div>
                <h2>Put these guides into practice</h2>
                <p>
                  Ready-made printable and fillable templates that make the
                  systems in these guides easy to keep up.
                </p>
              </div>
              <Link href="/templates" className="btn sb-btn-primary">
                Browse templates {arrowIcon}
              </Link>
            </aside>
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
