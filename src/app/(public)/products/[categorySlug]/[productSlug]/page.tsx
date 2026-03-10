import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ProductDetailClient from "./ProductDetailClient";
import { apiService } from "@/lib/api";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createProductJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ categorySlug: string; productSlug: string }>;
};

/**
 * Generate static params for ISR
 * Pre-renders all product pages at build time
 */
export async function generateStaticParams() {
  const response = await apiService.getProductCategories();

  if (!response.data) {
    return [];
  }

  const params: { categorySlug: string; productSlug: string }[] = [];

  for (const category of response.data) {
    if (category.items) {
      for (const item of category.items) {
        params.push({
          categorySlug: category.slug,
          productSlug: item.slug,
        });
      }
    }
  }

  return params;
}

/**
 * Generate metadata for SEO
 * Fetches product data from API
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const response = await apiService.getProductBySlug(categorySlug, productSlug);

  if (!response.data) return {};

  const product = response.data;

  const description = `${product.problem} ${product.bullets.join(". ")}.`;

  return createPageMetadata({
    title: product.title,
    description,
    pathname: `/products/${categorySlug}/${productSlug}`,
    image: product.image || undefined,
  });
}

/**
 * Product Detail Page Component
 * Fetches product and category data from API with ISR
 */
export default async function ProductDetailPage({ params }: Props) {
  const { categorySlug, productSlug } = await params;

  // Fetch product and category in parallel
  const [productResponse, categoryResponse] = await Promise.all([
    apiService.getProductBySlug(categorySlug, productSlug),
    apiService.getCategoryBySlug(categorySlug),
  ]);

  if (!productResponse.data || !categoryResponse.data) notFound();

  const product = productResponse.data;
  const category = categoryResponse.data;

  const jsonLd = createProductJsonLd({
    name: product.title,
    description: product.problem,
    href: `/products/${categorySlug}/${productSlug}`,
    image: product.image,
    price: product.price,
    offerUrl: product.etsyUrl,
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: category.name, href: `/products/${category.slug}` },
    { name: product.title, href: `/products/${categorySlug}/${productSlug}` },
  ]);

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />

      <section className="sb-section">
        <div className="container">
          {/* Breadcrumb Navigation */}
          <nav className="sb-breadcrumb" aria-label="Breadcrumb">
            <Link
              href={`/products/${category.slug}`}
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
              Back to {category.name}
            </Link>
          </nav>

          <ProductDetailClient product={product} />
        </div>
      </section>
    </>
  );
}
