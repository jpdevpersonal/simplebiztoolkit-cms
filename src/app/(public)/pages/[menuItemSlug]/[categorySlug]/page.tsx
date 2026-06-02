/**
 * Category page listing – shows all published pages within a category.
 * Mirrors /products/[categorySlug] which lists products in a product-category.
 */

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { apiService } from "@/lib/api";
import { slugify } from "@/lib/slugify";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createPageMetadata,
  normalizePublicUrl,
} from "@/lib/seo";
import "@/styles/contentCards.css";
import "@/styles/pages.css";

type Props = {
  params: Promise<{ menuItemSlug: string; categorySlug: string }>;
};

export const revalidate = 300;

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
  return createPageMetadata({
    title: `${cat.title} - ${item.title}`,
    description: cat.description || `Browse ${cat.title} pages.`,
    pathname: `/pages/${menuItemSlug}/${categorySlug}`,
  });
}

export default async function CategoryPageListing({ params }: Props) {
  const { menuItemSlug, categorySlug } = await params;
  const data = await resolve(menuItemSlug, categorySlug);
  if (!data) notFound();
  const { item, cat, publishedPages } = data;

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

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: item.title, href: `/pages/${menuItemSlug}` },
    { name: cat.title, href: `/pages/${menuItemSlug}/${categorySlug}` },
  ]);
  const collectionJsonLd = createCollectionPageJsonLd({
    name: cat.title,
    description: cat.description || `Browse ${cat.title} pages.`,
    href: `/pages/${menuItemSlug}/${categorySlug}`,
  });

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <section className="sb-section pages-section">
        <div className="container">
          <SiteBreadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: item.title, href: `/pages/${menuItemSlug}` },
              {
                name: cat.title,
                href: `/pages/${menuItemSlug}/${categorySlug}`,
              },
            ]}
          />

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
            <div className="row g-3 mt-2">
              {publishedPages.map((page) => {
                const imageSrc =
                  normalizePublicUrl(page.featuredImage) ??
                  normalizePublicUrl(page.headerImage);

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
                              unoptimized={shouldBypassNextImageOptimization(
                                imageSrc,
                              )}
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
                          <div className="sb-muted" style={{ fontSize: 13 }}>
                            {cat.title}
                          </div>
                          {(() => {
                            const pageDate = formatPageDate(page.dateISO);
                            return pageDate ? (
                              <div
                                className="sb-muted"
                                style={{ fontSize: 13 }}
                              >
                                {pageDate}
                              </div>
                            ) : null;
                          })()}
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

                        <div className="mt-3 d-flex justify-content-end text-success">
                          {openContentIcon}
                        </div>
                      </article>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
