import type { Metadata } from "next";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import ProductDetailClient from "./ProductDetailClient";
import { apiService } from "@/lib/api";
import {
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createHowToJsonLd,
  createPageMetadata,
  createProductJsonLd,
} from "@/lib/seo";

type Props = {
  params: Promise<{ categorySlug: string; productSlug: string }>;
};

export const revalidate = 300;

/**
 * Detect whether a template is a fillable PDF. The single source of truth
 * is the product title: only titles containing the word "fillable" are
 * treated as fillable. Everything else is treated as a print-and-write
 * template so we never tell a customer to "type into the fields" on a
 * template that doesn't have any.
 */
type TemplateFormat = "fillable" | "printable";

function detectTemplateFormat(title?: string | null): TemplateFormat {
  return /\bfillable\b/i.test(title ?? "") ? "fillable" : "printable";
}

function buildHowToSteps(format: TemplateFormat) {
  const steps = [
    {
      name: "Buy on Etsy",
      text: "Click 'Get It Now' to open the listing on Etsy and complete a secure checkout. No account is required to use the files after purchase.",
    },
    {
      name: "Download your files",
      text: "On your Etsy Purchases and Reviews page, click Download Files. Your PDFs are delivered instantly.",
    },
    {
      name: "Choose your paper size",
      text: "Open the PDF in any free reader (Adobe Acrobat Reader, Chrome, Edge, Safari or Apple Preview). Select A4 or US Letter to match your printer.",
    },
  ];

  if (format === "fillable") {
    steps.push({
      name: "Fill it in on screen",
      text: "Open the PDF in Adobe Acrobat Reader, your web browser (Chrome, Edge, Safari or Firefox) or Apple Preview, then type directly into the fillable fields. Save your filled copy, or print it once you're done.",
    });
  }

  steps.push({
    name: "Print and reuse",
    text: "Print the PDF on A4 or US Letter paper and complete it by hand. Re-print whenever you need a fresh copy — your purchase covers personal and single-business use.",
  });

  return steps;
}

/**
 * Generic product-level FAQs. These supplement the global FAQ but are
 * surfaced per-product so the FAQPage JSON-LD is co-located with the product
 * — a strong AI-citation signal.
 */
function getProductFaqItems(productTitle: string, format: TemplateFormat) {
  const formatQuestion =
    format === "fillable"
      ? {
          question: "Can I type into the PDF on my computer?",
          answer:
            "Yes — this template is fillable. Type directly into the PDF fields using Adobe Acrobat Reader, your web browser (Chrome, Edge, Safari or Firefox) or Apple Preview, then save or print your filled copy. You can also print the blank template and complete it by hand if you prefer.",
        }
      : {
          question: "Is this template fillable on a computer?",
          answer:
            "No — this is a print-and-write template, designed to be printed on A4 or US Letter paper and completed by hand. It does not contain editable form fields. If you'd like a fillable PDF version, check our other listings for the same template marked 'fillable'.",
        };

  return [
    {
      question: `How do I receive the ${productTitle} after purchase?`,
      answer:
        "Etsy delivers the files instantly after checkout. Find the Download Files button on your Etsy Purchases and Reviews page; most customers download and print within a minute or two.",
    },
    {
      question: "What paper sizes does it support?",
      answer:
        "Both A4 and US Letter sizes are included. Choose the appropriate size at print time — no separate purchase needed.",
    },
    formatQuestion,
    {
      question: "Is there a refund policy?",
      answer:
        "Because the templates are delivered instantly as digital files, all sales are final per Etsy's policy. If you receive the wrong file or there's a problem with the download, message us through Etsy and we'll fix it.",
    },
  ];
}

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
  const description =
    `${cleanProblem ? cleanProblem + " " : ""}Printable PDF template from Simple Biz Toolkit. Includes ${bulletSnippet || "A4 and US Letter sizes"}. Instant download via Etsy.`.slice(
      0,
      300,
    );

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

  const jsonLd = createProductJsonLd({
    name: product.title,
    description: productDescription,
    href: `/templates/${categorySlug}/${productSlug}`,
    image: product.image,
    price: product.price,
    offerUrl: product.etsyUrl,
    sku: product.slug,
    category: category.name,
    attributes: [
      { name: "File format", value: "PDF" },
      { name: "Paper sizes", value: "A4, US Letter" },
      { name: "Delivery", value: "Instant digital download via Etsy" },
      { name: "License", value: "Personal & single-business use" },
    ],
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Templates", href: "/templates" },
    { name: category.name, href: `/templates/${category.slug}` },
    { name: product.title, href: `/templates/${categorySlug}/${productSlug}` },
  ]);

  const templateFormat = detectTemplateFormat(product.title);
  const howToSteps = buildHowToSteps(templateFormat);
  const howToIntro =
    templateFormat === "fillable"
      ? `Download and start using the ${product.title} — a fillable PDF from Simple Biz Toolkit — in minutes.`
      : `Download, print and start using the ${product.title} — a printable PDF from Simple Biz Toolkit — in minutes.`;

  const howToJsonLd = createHowToJsonLd({
    name: `How to use the ${product.title}`,
    description: howToIntro,
    totalTimeMinutes: 5,
    steps: howToSteps,
  });

  const faqItems = getProductFaqItems(product.title, templateFormat);
  const faqJsonLd = createFaqJsonLd(faqItems);

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={howToJsonLd} />
      <JsonLd json={faqJsonLd} />

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

          {/* How-to block (HowTo JSON-LD already emitted above) */}
          <section
            className="sb-section"
            aria-labelledby="sb-howto-heading"
            style={{ paddingTop: "1.5rem" }}
          >
            <h2
              id="sb-howto-heading"
              style={{ fontWeight: 700, marginBottom: "1.25rem" }}
            >
              How to use the {product.title}
            </h2>
            <ol
              className="sb-card template-howto-card"
              style={{ paddingLeft: "3.25rem" }}
            >
              {howToSteps.map((step, index) => (
                <li
                  key={step.name}
                  className={index === howToSteps.length - 1 ? "mb-0" : "mb-2"}
                >
                  <strong>{step.name}</strong> — {step.text}
                </li>
              ))}
            </ol>
          </section>

          {/* Product FAQ block (FAQPage JSON-LD already emitted above) */}
          <section
            className="sb-section"
            aria-labelledby="sb-product-faq-heading"
            style={{ paddingTop: "1.5rem" }}
          >
            <h2
              id="sb-product-faq-heading"
              style={{ fontWeight: 700, marginBottom: "1.25rem" }}
            >
              Frequently asked questions
            </h2>
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="sb-card template-faq-card"
              >
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
