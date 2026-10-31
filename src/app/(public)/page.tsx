import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import TrustBar from "@/components/TrustBar";
import FaqAccordion from "@/components/FaqAccordion";
import "@/styles/home.css";
import "@/styles/tools-featured.css";
import "@/styles/bootstrap-accordion.scss";
import "@/styles/faq.css";
import TestimonialGrid from "@/components/TestimonialGrid";
import ProductGrid from "@/components/ProductGrid";
import FeaturedToolsGrid from "@/components/FeaturedToolsGrid";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import TrackedLink from "@/components/TrackedLink";
import { featuredProducts } from "@/data/featured";
import { featuredTools } from "@/data/featuredTools";
import { getPublicVisibleStats } from "@/lib/publicStats";
import { getStarSellerLabel, type StatValueMap } from "@/lib/stats";
import { apiService, type Faq } from "@/lib/api";
import { stripHtml } from "@/lib/sanitize";
import { createFaqJsonLd } from "@/lib/seo";

// Matches getMenuItemLandingHref() for the "Tools" menu item.
const TOOLS_LANDING_HREF = "/pages/tools";

export const revalidate = 300;

const listFormatter = new Intl.ListFormat("en-GB", {
  style: "long",
  type: "conjunction",
});

async function getVisibleStats(): Promise<StatValueMap> {
  return getPublicVisibleStats();
}

/** Comma-separated trust summary appended to the meta description. */
function buildTrustSummary(stats: StatValueMap): string {
  const fragments: string[] = [];

  if (stats.rating) fragments.push(`${stats.rating} average rating`);
  if (stats.reviews) fragments.push(`${stats.reviews} reviews`);
  if (stats.sales) fragments.push(`${stats.sales} sales`);

  const starSeller = getStarSellerLabel(stats["star-seller"]);
  if (starSeller) fragments.push(starSeller);

  return fragments.length > 0 ? ` ${fragments.join(", ")}.` : "";
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getVisibleStats();

  return {
    title: "Small Business Templates & Tools | Invoices, Ledgers & More",
    description: `Business templates and browser-based tools for small business owners, online sellers, freelancers and landlords. Template purchases are completed through Etsy.${buildTrustSummary(stats)}`,
    alternates: { canonical: "/" },
    openGraph: {
      title: "Small Business Templates & Tools | Simple Biz Toolkit",
      description:
        "Business templates and free browser-based tools for small business owners, freelancers and online sellers. Template purchases are completed through Etsy.",
      url: "/",
    },
  };
}

export default async function HomePage() {
  const [stats, faqResponse] = await Promise.all([
    getVisibleStats(),
    apiService.getFaqs(),
  ]);
  const homeFaqs: Faq[] = (faqResponse.data ?? []).slice(0, 6);
  const starSellerLabel = getStarSellerLabel(stats["star-seller"]);

  const trust: string[] = [];
  if (stats.rating) trust.push(`${stats.rating} average Etsy rating`);
  if (stats.reviews) trust.push(`${stats.reviews} customer reviews`);
  if (stats.sales) trust.push(`${stats.sales} sales`);
  if (starSellerLabel) trust.push(starSellerLabel);
  trust.push("Secure checkout via Etsy");

  const aboutTrustClauses: string[] = [];
  if (stats.sales) aboutTrustClauses.push(`${stats.sales} sales`);
  if (stats.rating) aboutTrustClauses.push(`a ${stats.rating} average rating`);
  if (starSellerLabel) aboutTrustClauses.push(`${starSellerLabel} status`);

  const aboutTrustSentence =
    aboutTrustClauses.length > 0
      ? `With ${listFormatter.format(aboutTrustClauses)}, we focus on creating simple solutions that make everyday business tasks easier.`
      : "We focus on creating simple solutions that make everyday business tasks easier.";

  const homeFaqJsonLd = createFaqJsonLd(
    homeFaqs.map((faq) => ({
      question: faq.q,
      answer: stripHtml(faq.a || ""),
    })),
  );

  return (
    <>
      {homeFaqs.length > 0 && <JsonLd json={homeFaqJsonLd} />}

      <section className="sb-hero">
        <div className="sb-hero-bg" aria-hidden="true">
          <picture>
            <source
              media="(max-width: 768px)"
              srcSet="/images/hero-image-mobile.webp"
            />
            <source
              media="(min-width: 769px) and (max-width: 1280px)"
              srcSet="/images/hero-image-tablet.webp"
            />
            <source
              media="(min-width: 1281px)"
              srcSet="/images/hero-image-desk.webp"
            />
            <img
              src="/images/hero-image-desk.webp"
              alt=""
              className="sb-hero-img"
              fetchPriority="high"
            />
          </picture>
        </div>
        <div className="sb-hero-overlay" aria-hidden="true" />

        <div className="container">
          <div className="sb-hero-inner">
            <span className="sb-hero-eyebrow">
              Practical tools for independent businesses
            </span>

            <h1 className="sb-hero-title">
              Simple business templates &amp; tools that keep work moving
            </h1>

            <p className="sb-hero-subtitle sb-speakable">
              Business templates and browser-based tools for small business
              owners, online sellers, freelancers and landlords.
            </p>

            <div className="sb-hero-actions">
              <TrackedLink
                href="/templates"
                className="btn sb-btn-primary sb-btn-lg"
                eventName="cta_click"
                eventParams={{
                  placement: "homepage_hero_primary",
                  destination_type: "template_category",
                }}
              >
                Browse Templates
                <svg
                  className="sb-btn-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TrackedLink>
              <TrackedLink
                href={TOOLS_LANDING_HREF}
                className="sb-btn-ghost-hero"
                eventName="cta_click"
                eventParams={{
                  placement: "homepage_hero_secondary",
                  destination_type: "tool",
                }}
              >
                Try Free Tools
              </TrackedLink>
            </div>

            <p className="sb-hero-reassurance">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Secure Checkout via Etsy
            </p>
          </div>
        </div>
      </section>

      <div className="sb-hero-trust-section">
        <div className="container">
          <div className="sb-hero-trust-inline">
            <TrustBar items={trust} />
          </div>
        </div>
      </div>

      {/* ====== POPULAR PRODUCTS ====== */}
      <section className="sb-section sb-products-section">
        <div className="container">
          <div className="sb-section-header sb-products-head">
            <span className="sb-section-eyebrow">Best Sellers</span>
            <h2>Our Popular Templates</h2>
            <p>A selection of templates for common small-business tasks.</p>
          </div>
          <ProductGrid
            products={featuredProducts}
            placement="homepage_popular_templates"
          />
          <div className="text-center mt-4">
            <Link href="/templates" className="btn sb-btn-ghost">
              Browse all templates
            </Link>
          </div>
        </div>
      </section>

      {/* ====== BROWSE BY NEED (internal linking) ====== */}
      <section
        className="sb-section sb-section-alt"
        aria-labelledby="sb-categories-heading"
      >
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">Browse by need</span>
            <h2 id="sb-categories-heading">Find the template you need</h2>
            <p>Browse template categories by the task you need to manage.</p>
          </div>
          <div className="row g-3">
            {[
              {
                href: "/templates/accounting-ledger",
                title: "Accounting ledger templates",
                blurb:
                  "Browse accounting ledger products and check each listing for included fields and formats.",
              },
              {
                href: "/templates/invoices",
                title: "Invoice templates",
                blurb: "Templates for preparing and organizing invoices.",
              },
              {
                href: "/templates/estimates",
                title: "Estimate & quote templates",
                blurb:
                  "Templates for preparing estimates and quotes for clients.",
              },
              {
                href: "/templates/time-sheet",
                title: "Time sheet templates",
                blurb:
                  "Weekly, bi-weekly and monthly time tracking for employees and contractors.",
              },
              {
                href: "/templates/rent-payment-ledger",
                title: "Rent payment ledgers",
                blurb:
                  "Track rent received, late payments and balances per tenant or unit.",
              },
              {
                href: "/templates/expense-and-spending",
                title: "Expense & spending trackers",
                blurb:
                  "Simple expense logs for budgeting, tax prep and household or business spending.",
              },
              {
                href: "/templates/payment-tracker",
                title: "Payment trackers",
                blurb:
                  "Log who paid, when and how — perfect for clients on instalment plans.",
              },
              {
                href: "/templates/order-forms-and-trackers",
                title: "Order forms & trackers",
                blurb:
                  "Take, fulfil and track orders for handmade, print-on-demand and small e-commerce shops.",
              },
            ].map((cat) => (
              <div className="col-md-6 col-lg-3" key={cat.href}>
                <TrackedLink
                  href={cat.href}
                  className="sb-content-link d-block h-100 text-reset text-decoration-none"
                  eventName="select_item"
                  eventParams={{
                    placement: "homepage_template_categories",
                    destination_type: "template_category",
                    category_slug: cat.href.split("/").at(-1),
                    item_name: cat.title,
                  }}
                >
                  <article className="sb-info-tile h-100">
                    <h3 className="sb-tile-title">{cat.title}</h3>
                    <p className="sb-muted sb-small-copy mb-0">{cat.blurb}</p>
                    <span className="sb-info-tile-cta">
                      Browse
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </article>
                </TrackedLink>
              </div>
            ))}
          </div>
          <div className="text-center mt-4">
            <Link href="/templates" className="btn sb-btn-ghost">
              See all template categories
            </Link>
          </div>
        </div>
      </section>

      {/* ====== FEATURED TOOLS ====== */}
      <section className="sb-section sb-tools-section">
        <div className="container">
          <div className="sb-section-header sb-products-head">
            <span className="sb-section-eyebrow">Free Tools</span>
            <h2>Free Business Tools</h2>
            <p>
              Free browser-based calculators and generators to help you price,
              quote and track your business. No sign-up, nothing stored.
            </p>
          </div>
          <FeaturedToolsGrid tools={featuredTools} />
          <div className="text-center mt-4">
            <Link href={TOOLS_LANDING_HREF} className="btn sb-btn-ghost">
              See all tools
            </Link>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="sb-section sb-section-alt">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3 sb-testimonial-header">
            <div>
              <span className="sb-section-eyebrow">Testimonials</span>
              <h2>What customers say</h2>
              <p className="sb-muted mb-0">Real feedback from Etsy buyers.</p>
            </div>
            <Link
              className="btn sb-btn-ghost sb-see-more-desktop"
              href="/testimonials"
            >
              See more reviews
            </Link>
          </div>
          <TestimonialGrid count={3} />
          <div className="text-center mt-3 sb-see-more-mobile">
            <Link className="btn sb-btn-ghost" href="/testimonials">
              See more reviews
            </Link>
          </div>

          <div className="text-center mt-4">
            <EtsyCtaButton
              label="Browse the full shop"
              hideOnHome={false}
              analyticsPlacement="homepage_testimonials"
            />
          </div>
        </div>
      </section>

      {/* ====== VALUE PROPS ====== */}
      <section className="sb-section">
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">Why Simple Biz Toolkit?</span>
            <h2>Designed to be simple</h2>
            <p>
              Browse templates and browser-based tools for common small-business
              tasks. Product details vary by listing.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="sb-value-card">
                <div className="sb-value-icon" aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <h3 className="sb-tile-title">Essential templates</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Tracking, planning, and admin, without overcomplication.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="sb-value-card">
                <div className="sb-value-icon" aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <h3 className="sb-tile-title">Simple systems</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Tools and templates for recurring record-keeping tasks.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="sb-value-card">
                <div className="sb-value-icon" aria-hidden="true">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="sb-tile-title">Real-world use</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Made for small business owners, solopreneurs, and online
                  sellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== WHO IT'S FOR ====== */}
      <section
        className="sb-section sb-section-alt"
        aria-labelledby="sb-personas-heading"
      >
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">Who it&apos;s for</span>
            <h2 id="sb-personas-heading">
              Built for the people running the business
            </h2>
            <p>
              Explore templates and tools for common small-business and
              record-keeping tasks.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-md-6 col-lg-3">
              <div className="sb-info-tile h-100">
                <h3 className="sb-tile-title">Small business owners</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Browse tools and templates that may support your bookkeeping
                  and record-keeping workflows.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-info-tile h-100">
                <h3 className="sb-tile-title">Online sellers</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Review available resources for order, fee, shipping and profit
                  tracking.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-info-tile h-100">
                <h3 className="sb-tile-title">
                  Freelancers &amp; solopreneurs
                </h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Explore resources for estimates, time tracking and invoicing.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-info-tile h-100">
                <h3 className="sb-tile-title">Landlords &amp; managers</h3>
                <p className="sb-muted sb-small-copy mb-0">
                  Browse record-keeping resources and check product listings for
                  their intended use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="sb-section sb-how-it-works">
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">
              Simple, convenient and affordable
            </span>
            <h2>Download. Print. Done.</h2>
            <p>
              Three steps stand between you and a better-organised business.
            </p>
          </div>
          <div className="sb-steps-grid">
            <div className="sb-step">
              <div className="sb-step-number" aria-hidden="true">
                1
              </div>
              <h3>Choose your template</h3>
              <p className="sb-muted">
                Browse by category — invoicing, planning, tracking, and more.
              </p>
            </div>
            <div className="sb-step-connector" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="sb-step">
              <div className="sb-step-number" aria-hidden="true">
                2
              </div>
              <h3>Buy securely on Etsy</h3>
              <p className="sb-muted">
                Checkout is handled by Etsy — trusted by millions of buyers
                worldwide.
              </p>
            </div>
            <div className="sb-step-connector" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="sb-step">
              <div className="sb-step-number" aria-hidden="true">
                3
              </div>
              <h3>Review product details</h3>
              <p className="sb-muted">
                Check the product page and Etsy listing for included files,
                delivery details and usage terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FAQ (Schema-rich) ====== */}
      <section className="sb-section" aria-labelledby="sb-home-faq-heading">
        <div className="container">
          <div className="sb-section-header">
            <span className="sb-section-eyebrow">Common questions</span>
            <h2 id="sb-home-faq-heading">Frequently asked questions</h2>
          </div>
          <div className="sb-home-faq-list">
            <FaqAccordion
              faqs={homeFaqs}
              showSearchAndIntro={false}
              expandFirst={false}
            />
            <div className="text-center mt-3">
              <Link href="/faq" className="btn sb-btn-ghost">
                See all FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== ABOUT (short) ====== */}
      <section
        className="sb-section sb-section-alt"
        aria-labelledby="sb-about-heading"
      >
        <div className="container">
          <div className="sb-text-column">
            <span className="sb-section-eyebrow">About</span>
            <h2 id="sb-about-heading">About Simple Biz Toolkit</h2>
            <p className="sb-muted">
              Simple Biz Toolkit provides practical business tools and
              ready-to-use templates designed to help small business owners and
              online sellers stay organised and save time. {aboutTrustSentence}
            </p>
            <p className="sb-muted">
              Product formats, features, availability and delivery details vary.
              Check each product page and Etsy listing for current information.
            </p>
            <p className="mb-0">
              <Link href="/about" className="sb-content-link">
                About Simple Biz Toolkit
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="sb-section sb-final-cta">
        <div className="container text-center">
          <h2>Ready to get organised?</h2>
          <p className="sb-section-intro sb-final-cta-copy">
            Browse available templates and tools, and review each listing to
            decide whether it fits your needs.
          </p>
          <div className="d-flex justify-content-center flex-wrap gap-3">
            <TrackedLink
              href="/templates"
              className="btn sb-btn-primary sb-btn-lg"
              eventName="cta_click"
              eventParams={{
                placement: "homepage_final",
                destination_type: "template_category",
              }}
            >
              Browse Templates
            </TrackedLink>
            <Link href="/faq" className="btn sb-btn-ghost">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
