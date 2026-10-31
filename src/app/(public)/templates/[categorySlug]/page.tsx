import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import EtsyCtaButton from "@/components/EtsyCtaButton";
import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import ProductGrid from "@/components/ProductGrid";
import { apiService } from "@/lib/api";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";
import {
  formatTemplateCount,
  getTemplateCategoryStats,
} from "@/lib/templateCategoryStats";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createItemListJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import "@/styles/products.css";
import "@/styles/templatesBrowse.css";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export const revalidate = 300;

/**
 * Generate static params for ISR
 * Pre-renders all category pages at build time
 */
export async function generateStaticParams() {
  const response = await apiService.getProductCategories();

  if (!response.data) {
    return [];
  }

  return response.data.map((category) => ({ categorySlug: category.slug }));
}

/**
 * Generate metadata for SEO
 * Fetches category data from API
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const response = await apiService.getCategoryBySlug(categorySlug);

  if (!response.data) return {};

  const category = response.data;
  const itemCount = category.items?.length ?? 0;
  const cleanSummary = (category.summary ?? "").replace(/\s+/g, " ").trim();

  const description = cleanSummary
    ? `${cleanSummary} Browse ${itemCount > 0 ? `${itemCount} ` : ""}${category.name.toLowerCase()} templates from Simple Biz Toolkit. Check each product for file and delivery details.`
    : `${category.name} templates from Simple Biz Toolkit. Check each product for file and delivery details.`;

  return createPageMetadata({
    title: `${category.name} Templates`,
    description,
    pathname: `/templates/${category.slug}`,
    image: category.heroImage || undefined,
  });
}

/**
 * Category Page Component
 * Fetches category and products from API with ISR
 */
export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const [response, allCategoriesResponse] = await Promise.all([
    apiService.getCategoryBySlug(categorySlug),
    apiService.getProductCategories(),
  ]);

  if (!response.data) notFound();

  const category = response.data;
  const otherCategories = (allCategoriesResponse?.data ?? []).filter(
    (other) => other.slug !== category.slug,
  );

  const jsonLd = createCollectionPageJsonLd({
    name: `${category.name} Templates`,
    description: category.summary,
    href: `/templates/${category.slug}`,
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Templates", href: "/templates" },
    { name: category.name, href: `/templates/${category.slug}` },
  ]);

  const items = category.items ?? [];
  const stats = getTemplateCategoryStats(items);
  const itemListJsonLd = createItemListJsonLd({
    name: `${category.name} templates`,
    items: items.map((item) => ({
      name: item.title,
      href: `/templates/${category.slug}/${item.slug}`,
      image: item.image,
    })),
  });

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={itemListJsonLd} />

      <section className="sb-section template-category-section">
        <div className="container">
          <SiteBreadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: "Templates", href: "/templates" },
              { name: category.name, href: `/templates/${category.slug}` },
            ]}
          />

          <div className="template-category-hero">
            <div className="template-category-hero-copy">
              <span className="sb-section-eyebrow">Template category</span>
              <h1>{category.name}</h1>
              {category.summary && (
                <p className="template-category-summary">{category.summary}</p>
              )}
              <ul className="template-category-facts">
                {stats.count > 0 && <li>{formatTemplateCount(stats.count)}</li>}
                {stats.fromPrice && <li>From {stats.fromPrice}</li>}
                <li>Instant digital download</li>
              </ul>
              {stats.count > 0 && (
                <a href="#items" className="btn sb-btn-primary">
                  See{" "}
                  {stats.count === 1
                    ? "the template"
                    : `all ${stats.count} templates`}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M8 3v10M4 9l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </div>

            <div className="template-category-hero-side">
              {category.heroImage ? (
                <div className="template-category-hero-image">
                  <Image
                    src={category.heroImage}
                    alt={`${category.name} templates preview`}
                    width={900}
                    height={630}
                    sizes="(max-width: 992px) 100vw, 460px"
                    unoptimized={shouldBypassNextImageOptimization(
                      category.heroImage,
                    )}
                  />
                </div>
              ) : null}
              {category.howThisHelps && (
                <div className="template-category-helps">
                  <h2>How this helps</h2>
                  <p>{category.howThisHelps}</p>
                </div>
              )}
            </div>
          </div>

          <div id="items" className="template-category-items">
            <h2 className="template-category-items-title">
              All {category.name} templates <span>({stats.count})</span>
            </h2>
            <ProductGrid products={items} placement="category_templates" />
          </div>

          {otherCategories.length > 0 && (
            <nav
              className="template-category-others"
              aria-label="Other template categories"
            >
              <h2>Explore other templates</h2>
              <ul>
                {otherCategories.map((other) => (
                  <li key={other.slug}>
                    <Link href={`/templates/${other.slug}`}>{other.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <aside className="templates-help-band">
            <div>
              <h2>Can&apos;t find exactly what you need?</h2>
              <p>
                Browse every category, or see the full range in our Etsy shop.
              </p>
            </div>
            <div className="templates-help-actions">
              <Link href="/templates" className="btn sb-btn-primary">
                All templates
              </Link>
              <EtsyCtaButton
                label="Visit our Etsy shop"
                className="templates-help-etsy"
                hideOnHome={false}
                analyticsPlacement="category_help_band"
              />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
