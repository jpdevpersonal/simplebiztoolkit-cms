import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import ProductGrid from "@/components/ProductGrid";
import { apiService } from "@/lib/api";
import { links } from "@/config/links";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createFaqJsonLd,
  createItemListJsonLd,
  createPageMetadata,
} from "@/lib/seo";
import "@/styles/products.css";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export const revalidate = 300;

/**
 * Common buyer-intent FAQs surfaced on every category page. The phrasing is
 * intentionally generic so it works as a baseline FAQPage signal for any
 * category; per-category overrides can be added in a future pass.
 */
function getCategoryFaqItems(categoryName: string) {
  return [
    {
      question: `What's included in the ${categoryName} templates?`,
      answer:
        "Each listing includes both A4 and US Letter sizes. Where applicable you get a fillable PDF (type directly into the form using Adobe Reader, Chrome, Edge or Apple Preview) and a print-and-write PDF. Full details are listed on every product page and in the Etsy listing.",
    },
    {
      question: "Can I use the templates for my business and clients?",
      answer:
        "Yes. Every template is licensed for unlimited personal and business use by the buyer for a single business or shop. You may not resell, redistribute or share the source files.",
    },
    {
      question: "How do I download my files after buying?",
      answer:
        "Etsy delivers the files instantly. Open your Etsy Purchases and Reviews page, find the order, and click Download Files. There's no shipping wait — most customers print or open their first copy within minutes.",
    },
    {
      question: "Do I need special software?",
      answer:
        "No. A free PDF reader (Adobe Acrobat Reader, Chrome, Edge, Safari, Firefox or Apple Preview) is enough. No subscription, no account, no design software.",
    },
    {
      question: "Will the templates print well on a home printer?",
      answer:
        "Yes — every template is laid out for clean printing on standard A4 or US Letter paper using a home or office printer. Use the 'Actual size' (100%) setting in your print dialog for best results.",
    },
  ];
}

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
    ? `${cleanSummary} Browse ${itemCount > 0 ? `${itemCount} ` : ""}printable ${category.name.toLowerCase()} templates from Simple Biz Toolkit — instant PDF download via Etsy, A4 and US Letter included.`
    : `Printable ${category.name.toLowerCase()} templates from Simple Biz Toolkit — instant PDF download via Etsy, A4 and US Letter included.`;

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
  const response = await apiService.getCategoryBySlug(categorySlug);

  if (!response.data) notFound();

  const category = response.data;

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
  const itemListJsonLd = createItemListJsonLd({
    name: `${category.name} templates`,
    items: items.map((item) => ({
      name: item.title,
      href: `/templates/${category.slug}/${item.slug}`,
      image: item.image,
    })),
  });

  const faqItems = getCategoryFaqItems(category.name);
  const faqJsonLd = createFaqJsonLd(faqItems);

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={itemListJsonLd} />
      <JsonLd json={faqJsonLd} />

      <section className="sb-section">
        <div className="container">
          <SiteBreadcrumb
            items={[
              { name: "Home", href: "/" },
              { name: "Templates", href: "/templates" },
              { name: category.name, href: `/templates/${category.slug}` },
            ]}
          />

          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <h1 style={{ fontWeight: 700 }}>{category.name}</h1>
              <p className="sb-muted fs-5">{category.summary}</p>

              <div
                className="sb-card p-3"
                style={{ borderLeft: "3px solid var(--sb-brand-blue)" }}
              >
                <h2
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  How this helps
                </h2>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  {category.howThisHelps}
                </p>
              </div>
            </div>

            <div className="col-lg-5">
              {category.heroImage ? (
                <div className="sb-card p-3">
                  <Image
                    src={category.heroImage}
                    alt={`${category.name} printable templates preview`}
                    className="img-fluid rounded-4"
                    width={900}
                    height={630}
                    sizes="(max-width: 992px) 100vw, 420px"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div id="items" className="mt-4">
            <ProductGrid products={category.items || []} />
          </div>
          <div className="mt-3 d-flex gap-2 flex-wrap">
            <a
              className="btn sb-btn-ghost"
              href={links.etsyShopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit our Etsy shop
            </a>
          </div>

          {/* Category FAQ block — FAQPage JSON-LD already emitted above */}
          <section
            className="sb-section"
            aria-labelledby="sb-category-faq-heading"
          >
            <h2
              id="sb-category-faq-heading"
              style={{ fontWeight: 700, marginBottom: "1rem" }}
            >
              {category.name} FAQs
            </h2>
            {faqItems.map((item) => (
              <details key={item.question} className="sb-card p-3 mb-2">
                <summary
                  style={{
                    fontWeight: 700,
                    fontSize: "1rem",
                    cursor: "pointer",
                  }}
                >
                  {item.question}
                </summary>
                <p className="sb-muted mb-0 mt-2">{item.answer}</p>
              </details>
            ))}
          </section>
        </div>
      </section>
    </>
  );
}
