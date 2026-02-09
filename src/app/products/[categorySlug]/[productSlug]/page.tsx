import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ProductDetailClient from "./ProductDetailClient";
import { categories } from "@/data/products";
import { site } from "@/config/site";

type Props = {
  params: Promise<{ categorySlug: string; productSlug: string }>;
};

// Helper to extract slug from productPageUrl
function getSlugFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

// Find product by slug across all categories
function findProductBySlug(categorySlug: string, productSlug: string) {
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) return null;

  const product = category.items.find(
    (item) => getSlugFromUrl(item.productPageUrl) === productSlug,
  );

  if (!product) return null;

  return { category, product };
}

export async function generateStaticParams() {
  const params: { categorySlug: string; productSlug: string }[] = [];

  for (const category of categories) {
    for (const item of category.items) {
      params.push({
        categorySlug: category.slug,
        productSlug: getSlugFromUrl(item.productPageUrl),
      });
    }
  }

  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, productSlug } = await params;
  const result = findProductBySlug(categorySlug, productSlug);

  if (!result) return {};

  const { product } = result;

  const title = `${product.title} | Simple Biz Toolkit`;
  const description = `${product.problem} ${product.bullets.join(". ")}.`;

  return {
    title: product.title,
    description,
    alternates: { canonical: product.productPageUrl },
    openGraph: {
      title,
      description,
      url: product.productPageUrl,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { categorySlug, productSlug } = await params;
  const result = findProductBySlug(categorySlug, productSlug);

  if (!result) notFound();

  const { category, product } = result;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.problem,
    image: product.image
      ? `https://simplebiztoolkit.com${product.image}`
      : undefined,
    url: `https://simplebiztoolkit.com${product.productPageUrl}`,
    brand: {
      "@type": "Organization",
      name: site.name,
    },
    offers: {
      "@type": "Offer",
      price: product.price.replace("$", ""),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: product.etsyUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: site.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${site.url}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.name,
        item: `${site.url}/products/${category.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: product.title,
        item: `${site.url}${product.productPageUrl}`,
      },
    ],
  };

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
