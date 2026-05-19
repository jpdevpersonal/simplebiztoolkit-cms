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

/**
 * Crisp, line-style SVG icons per category type.
 * Stroke uses currentColor so the parent badge controls the colour.
 */
const iconSvgProps = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const categoryIcons: Record<string, React.ReactNode> = {
  attendance: (
    <svg {...iconSvgProps}>
      <rect x="4" y="4" width="16" height="17" rx="2" />
      <path d="M9 2v4M15 2v4M4 10h16" />
      <path d="M8 15l2 2 4-4" />
    </svg>
  ),
  signIn: (
    <svg {...iconSvgProps}>
      <path d="M4 19h16" />
      <path d="M5 16l9-9 3 3-9 9H5z" />
      <path d="M13 6l3 3" />
    </svg>
  ),
  invoice: (
    <svg {...iconSvgProps}>
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  estimate: (
    <svg {...iconSvgProps}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
      <path d="M12 11v4" />
    </svg>
  ),
  timeSheet: (
    <svg {...iconSvgProps}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9 2h6" />
    </svg>
  ),
  ledger: (
    <svg {...iconSvgProps}>
      <path d="M5 4a2 2 0 0 1 2-2h11v18H7a2 2 0 0 0-2 2V4z" />
      <path d="M5 20a2 2 0 0 1 2-2h11" />
      <path d="M9 7h6M9 11h6" />
    </svg>
  ),
  rent: (
    <svg {...iconSvgProps}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </svg>
  ),
  order: (
    <svg {...iconSvgProps}>
      <path d="M3 7l9-4 9 4-9 4-9-4z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  ),
  mileage: (
    <svg {...iconSvgProps}>
      <path d="M5 17h14l-1.5-6h-11L5 17z" />
      <path d="M7 11l1-4h8l1 4" />
      <circle cx="8" cy="17.5" r="1.75" />
      <circle cx="16" cy="17.5" r="1.75" />
    </svg>
  ),
  planner: (
    <svg {...iconSvgProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 11h18" />
      <path d="M8 15h3M13 15h3M8 18h3" />
    </svg>
  ),
  profit: (
    <svg {...iconSvgProps}>
      <path d="M3 17l5-5 4 4 8-8" />
      <path d="M14 8h6v6" />
    </svg>
  ),
  payment: (
    <svg {...iconSvgProps}>
      <rect x="2.5" y="6" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M6 15h4" />
    </svg>
  ),
  expense: (
    <svg {...iconSvgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5c-.6-1-1.7-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 1.2 1 1.8 3 2.3s3 1.1 3 2.3c0 1.3-1.3 2.2-3 2.2-1.3 0-2.4-.5-3-1.5" />
    </svg>
  ),
  default: (
    <svg {...iconSvgProps}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  ),
};

/** Maps category slugs to an icon key. Order matters — most specific first. */
const categoryIconRules: Array<[string, keyof typeof categoryIcons]> = [
  ["attendance", "attendance"],
  ["sign-in", "signIn"],
  ["invoice", "invoice"],
  ["estimate", "estimate"],
  ["quote", "estimate"],
  ["time-sheet", "timeSheet"],
  ["timesheet", "timeSheet"],
  ["accounting", "ledger"],
  ["ledger", "ledger"],
  ["rent", "rent"],
  ["order", "order"],
  ["mileage", "mileage"],
  ["planner", "planner"],
  ["profit", "profit"],
  ["payment", "payment"],
  ["expense", "expense"],
  ["spending", "expense"],
];

function getCategoryIcon(slug: string): React.ReactNode {
  const match = categoryIconRules.find(([key]) => slug.includes(key));
  return categoryIcons[match ? match[1] : "default"];
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
