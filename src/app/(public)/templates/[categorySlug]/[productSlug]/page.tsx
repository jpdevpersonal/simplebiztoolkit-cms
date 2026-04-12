import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
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

export const revalidate = 300;

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
  const categoryResponse = await apiService.getCategoryBySlug(categorySlug);
  const productId = categoryResponse.data?.items?.find(
    (item) => item.slug === productSlug,
  )?.id;
  const response = await apiService.getProductBySlug(
    categorySlug,
    productSlug,
    productId,
  );

  if (!response.data) return {};

  const product = response.data;

  const description = `${product.problem} ${product.bullets.join(". ")}.`;

  return createPageMetadata({
    title: product.title,
    description,
    pathname: `/templates/${categorySlug}/${productSlug}`,
    image: product.image || undefined,
  });
}

/**
 * Product Detail Page Component
 * Fetches product and category data from API with ISR
 */
export default async function ProductDetailPage({ params }: Props) {
  const { categorySlug, productSlug } = await params;

  const categoryResponse = await apiService.getCategoryBySlug(categorySlug);
  const productId = categoryResponse.data?.items?.find(
    (item) => item.slug === productSlug,
  )?.id;
  const productResponse = await apiService.getProductBySlug(
    categorySlug,
    productSlug,
    productId,
  );

  if (!productResponse.data || !categoryResponse.data) notFound();

  const product = productResponse.data;
  const category = categoryResponse.data;

  const jsonLd = createProductJsonLd({
    name: product.title,
    description: product.problem,
    href: `/templates/${categorySlug}/${productSlug}`,
    image: product.image,
    price: product.price,
    offerUrl: product.etsyUrl,
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Templates", href: "/templates" },
    { name: category.name, href: `/templates/${category.slug}` },
    { name: product.title, href: `/templates/${categorySlug}/${productSlug}` },
  ]);

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />

      <section className="sb-section">
        <div className="container">
          <SiteBreadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: "Templates", href: "/templates" },
              { name: category.name, href: `/templates/${category.slug}` },
              {
                name: product.title,
                href: `/templates/${categorySlug}/${productSlug}`,
              },
            ]}
          />

          <ProductDetailClient product={product} />

          <SiteBreadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: "Templates", href: "/templates" },
              { name: category.name, href: `/templates/${category.slug}` },
              {
                name: product.title,
                href: `/templates/${categorySlug}/${productSlug}`,
              },
            ]}
            bottom
          />
        </div>
      </section>
    </>
  );
}
