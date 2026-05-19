import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import "@/styles/products.css";
import { apiService } from "@/lib/api";
import {
  createBreadcrumbJsonLd,
  createCollectionPageJsonLd,
  createFaqJsonLd,
  createItemListJsonLd,
  createPageMetadata,
} from "@/lib/seo";

const productsTitle =
  "Printable Small Business Templates — Invoices, Ledgers, Time Sheets & More";
const productsDescription =
  "Browse every Simple Biz Toolkit template category: accounting ledgers, invoices, estimates, time sheets, rent payment ledgers, order forms, sign-in sheets and more. Every template prints on A4 and US Letter and downloads instantly via Etsy.";

const templatesFaqItems = [
  {
    question: "What paper sizes do the templates support?",
    answer:
      "Every Simple Biz Toolkit template includes both A4 (used in the UK, EU, Australia and most of the world) and US Letter (used in the US and Canada). Choose the right size at print time — no separate purchase needed.",
  },
  {
    question: "Are the templates fillable on a computer?",
    answer:
      "Most templates are supplied as fillable PDFs that you can type into using Adobe Acrobat Reader, your web browser (Chrome, Edge, Safari, Firefox), or Apple Preview. A printable-only version is also included where applicable, so you can fill in by hand if you prefer.",
  },
  {
    question: "How quickly do I get my files after buying?",
    answer:
      "Instantly. Etsy delivers the files as soon as your payment is confirmed. You'll find a Download Files link on your Etsy Purchases and Reviews page — usually within a minute or two of checkout.",
  },
  {
    question: "Can I reuse the templates for my business?",
    answer:
      "Yes — every template is licensed for unlimited personal and business use by the buyer (single shop / single business). You may not resell, redistribute or share the source files.",
  },
  {
    question: "Which template should I pick for my use case?",
    answer:
      "If you're tracking money in and out, start with an Accounting Ledger. If you bill clients, use an Invoice or Estimate template. If you log hours for staff or contractors, choose a Time Sheet. Landlords should look at the Rent Payment Ledger. For online-sellers tracking orders, see Order Forms & Trackers.",
  },
];

export const revalidate = 300;

/** Maps category slugs to a representative emoji icon. */
const categoryIconMap: Record<string, string> = {
  "attendance-record": "📋",
  "sign-in-sheet": "✍️",
  "sign-in": "✍️",
  invoice: "🧾",
  invoices: "🧾",
  estimate: "💼",
  estimates: "💼",
  "time-sheet": "⏱️",
  "time-sheets": "⏱️",
  "accounting-ledger": "📒",
  accounting: "📒",
  ledger: "📒",
  "rent-payment": "🏠",
  rent: "🏠",
  "order-form": "📦",
  "order-forms": "📦",
  mileage: "🚗",
  planner: "📅",
  profit: "💰",
  "profit-loss": "💰",
};

function getCategoryIcon(slug: string): string {
  const match = Object.keys(categoryIconMap).find((k) => slug.includes(k));
  return match ? categoryIconMap[match] : "📄";
}

export const metadata: Metadata = createPageMetadata({
  title: productsTitle,
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
  const itemListJsonLd = createItemListJsonLd({
    name: "Simple Biz Toolkit template categories",
    items: categories.map((c) => ({
      name: c.name,
      href: `/templates/${c.slug}`,
      image: c.heroImage,
    })),
  });
  const faqJsonLd = createFaqJsonLd(templatesFaqItems);

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <JsonLd json={itemListJsonLd} />
      <JsonLd json={faqJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="products-header">
            <h1>Printable small business templates</h1>
            <p className="sb-muted sb-speakable">
              Printable and fillable PDF templates for small business owners,
              freelancers and landlords — invoices, estimates, ledgers, time
              sheets, order forms and more. Every template comes in A4 and US
              Letter sizes with instant Etsy download.
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
                  <div className="category-card-icon" aria-hidden="true">
                    {getCategoryIcon(c.slug)}
                  </div>
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

          {/* FAQ block with FAQPage JSON-LD already emitted above */}
          <section
            className="sb-section"
            aria-labelledby="sb-templates-faq-heading"
          >
            <h2
              id="sb-templates-faq-heading"
              style={{ fontWeight: 700, marginBottom: "1rem" }}
            >
              Template buying FAQ
            </h2>
            {templatesFaqItems.map((item) => (
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
