import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import "@/styles/products.css";
import { apiService } from "@/lib/api";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

const productsDescription =
  "Browse categories like accounting ledgers, time sheets, and rent trackers. Each tool links to Etsy for secure checkout.";

export const revalidate = 300;

export const metadata: Metadata = createPageMetadata({
  title: "Templates",
  description: productsDescription,
  pathname: "/templates",
});

export default async function ProductsPage() {
  const categories = (await apiService.getProductCategories()).data || [];
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Templates", href: "/templates" },
  ]);
  const collectionJsonLd = createCollectionPageJsonLd({
    name: "Template Categories",
    description: productsDescription,
    href: "/templates",
  });

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="products-header">
            <h1>Template Categories</h1>
            <p className="sb-muted">
              Browse our collection of simple, ready-to-use templates. All come
              in A4 and US-Letter sizes.
            </p>
          </div>

          <div className="category-grid">
            {categories.map((c) => (
              <Link
                href={`/templates/${c.slug}`}
                className="category-card-link"
                key={c.slug}
              >
                <article className="category-card">
                  <h2 className="category-card-title">{c.name}</h2>
                  <p className="category-card-summary">{c.summary}</p>
                  <span className="category-card-cta">
                    Browse templates
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
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
