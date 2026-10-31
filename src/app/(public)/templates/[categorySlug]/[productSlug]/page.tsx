import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import ProductDetailClient from "./ProductDetailClient";
import RelatedLinksBlock from "@/components/RelatedLinksBlock";
import { extractRelatedLinksBlocksFromHtml } from "@/lib/relatedLinks";
import { getProductSpecifications } from "@/lib/productSpecifications";
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

  const cleanProblem = (product.problem ?? "").replace(/\s+/g, " ").trim();
  const bulletSnippet = product.bullets.slice(0, 3).join(", ");
  const productSpecifications = getProductSpecifications(product);
  const description = [
    cleanProblem,
    bulletSnippet ? `Product details: ${bulletSnippet}.` : "",
    ...productSpecifications.map(
      ({ name, value }) => `${name}: ${value}.`,
    ),
    "See the Etsy listing for current file and purchase details.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

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

  const productDescription =
    product.description
      ?.replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || product.problem;
  const productSpecifications = getProductSpecifications(product);

  const jsonLd = createProductJsonLd({
    name: product.title,
    description: productDescription,
    href: `/templates/${categorySlug}/${productSlug}`,
    image: product.image,
    priceAmount: product.priceAmount,
    currency: product.priceCurrency,
    offerUrl: product.etsyUrl,
    sku: product.slug,
    category: category.name,
    attributes: productSpecifications,
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Templates", href: "/templates" },
    { name: category.name, href: `/templates/${category.slug}` },
    { name: product.title, href: `/templates/${categorySlug}/${productSlug}` },
  ]);

  const contentSource = product.description || product.problem;
  const { blocks: relatedLinksBlocks } = extractRelatedLinksBlocksFromHtml(
    contentSource || "",
  );

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

          {relatedLinksBlocks.length > 0 ? (
            <div style={{ paddingTop: "1.5rem" }}>
              {relatedLinksBlocks.map((block, index) => (
                <RelatedLinksBlock
                  key={`${block.title}-${index}`}
                  title={block.title}
                  items={block.items}
                  backgroundColor={block.backgroundColor}
                  borderWidth={block.borderWidth}
                  imageSize={block.imageSize}
                  variant="template"
                />
              ))}
            </div>
          ) : null}

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
