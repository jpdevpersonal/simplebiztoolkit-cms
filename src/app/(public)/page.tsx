import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import heroImage from "../../../public/images/hero-image-desk.webp";

import JsonLd from "@/components/JsonLd";
import TrustBar from "@/components/TrustBar";
import EmailCaptureForm from "@/components/EmailCaptureForm";
import "@/styles/home.css";
import "@/styles/products.css";
import TestimonialGrid from "@/components/TestimonialGrid";
import ProductGrid from "@/components/ProductGrid";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import { featuredProducts } from "@/data/featured";
import { links } from "@/config/links";
import { featureFlags } from "@/config/featureFlags";
import { createFaqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title:
    "Printable Small Business Templates & Toolkits | Invoices, Time Sheets, Ledgers",
  description:
    "Printable templates for small business owners, online sellers, freelancers and landlords. Invoices, time sheets, accounting ledgers, rent trackers and planners — instant PDF downloads via Etsy. 5.0 rated Etsy Star Seller with 3,500+ sales.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Printable Small Business Templates & Toolkits | Simple Biz Toolkit",
    description:
      "Printable invoices, time sheets, ledgers and planners for small business owners, freelancers and online sellers. Instant downloads via Etsy.",
    url: "/",
  },
};

const homeFaqItems = [
  {
    question: "Who are these templates for?",
    answer:
      "Simple Biz Toolkit templates are designed for small business owners, online sellers (Etsy, eBay, Shopify), freelancers, landlords, and anyone who needs a clear, printable system to run their business without subscription software. The same template typically works for both digital fill-in (Adobe Reader, GoodNotes, or your browser) and printing on A4 or US Letter paper.",
  },
  {
    question: "How do I receive my templates?",
    answer:
      "Every template is an instant digital download delivered through Etsy. After checkout you'll find a Download Files button under your Etsy Purchases and Reviews page. There is no shipping wait — most customers print or open their first copy within a few minutes of buying.",
  },
  {
    question: "Are the templates printable and editable?",
    answer:
      "All templates are designed for clean printing on A4 and US Letter paper. Fillable PDF versions can be typed into using your browser, Adobe Acrobat Reader, or Apple Preview before printing. Printable-only versions are intended to be printed first and then completed by hand.",
  },
  {
    question: "What software do I need?",
    answer:
      "A free PDF reader such as Adobe Acrobat Reader, your web browser (Chrome, Edge, Safari, Firefox), or Apple Preview is enough. No subscription, account or special software is required to use the templates.",
  },
  {
    question: "Do you offer refunds on digital downloads?",
    answer:
      "Because the templates are delivered immediately as digital downloads, Etsy's standard policy is that all sales are final. If you have a problem with a file or the wrong template was supplied, message us through Etsy and we will fix it or refund you.",
  },
  {
    question: "Why buy a printable template instead of using software?",
    answer:
      "Printable templates have no monthly fee, no learning curve and no data lock-in. They suit small businesses, side hustles and landlords who want a quick, paper-friendly system for tracking income, expenses, hours, invoices and payments without committing to a SaaS tool.",
  },
];

export default function HomePage() {
  const trust = [
    "Five Star Etsy rating",
    "Etsy Star Seller!",
    "Over 3800 sales",
    "Secure checkout via Etsy",
    "Excellent service & support",
  ];

  const homeFaqJsonLd = createFaqJsonLd(homeFaqItems);

  return (
    <>
      <JsonLd json={homeFaqJsonLd} />

      {/* ====== HERO ====== */}
      <section className="sb-hero">
        <span className="sb-hero-orb sb-hero-orb--1" aria-hidden="true" />
        <span className="sb-hero-orb sb-hero-orb--2" aria-hidden="true" />

        {/* Full-bleed background image via Next.js Image for optimisation */}
        <div className="sb-hero-bg" aria-hidden="true">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            loading="eager"
            placeholder="blur"
            sizes="100vw"
            className="sb-hero-img"
          />
        </div>
        {/* Dark gradient overlay for legibility */}
        <div className="sb-hero-overlay" aria-hidden="true" />

        <div className="container">
          <div className="sb-hero-inner">
            {/* Eyebrow trust pill */}
            <span className="sb-hero-eyebrow">
              <span className="sb-hero-eyebrow-dot" aria-hidden="true" />
              Trusted by 3,800+ small business owners
            </span>

            <h1 className="sb-hero-title">
              Printable small business templates
              <br />
              <em>that just work</em>
            </h1>

            <p className="sb-hero-subtitle sb-speakable">
              Instant-download invoices, time sheets, accounting ledgers, rent
              trackers and planners for small business owners, online sellers,
              freelancers and landlords. Print on A4 or US Letter, or fill in
              digitally — no software subscription needed.
            </p>

            <div className="sb-hero-stars" aria-label="Five star rated on Etsy">
              <span className="sb-hero-stars-icons" aria-hidden="true">
                ★★★★★
              </span>
              <span className="sb-hero-stars-label">
                <strong>5.0</strong> &middot; 3,800+ five-star reviews on Etsy
              </span>
            </div>

            <div className="sb-hero-actions">
              <Link href="/templates" className="btn sb-btn-primary sb-btn-lg">
                Browse All Templates
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
              </Link>
              <Link
                href={links.etsyShopUrl}
                className="sb-btn-ghost-hero"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Etsy
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                  style={{ opacity: 0.8 }}
                >
                  <path
                    d="M2.5 2.5h9M11.5 2.5v9M11.5 2.5 2.5 11.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
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
              Secure checkout &middot; Instant download &middot; No account
              needed
            </p>
          </div>
        </div>

        {/* Social proof stats strip — anchors trust at the hero bottom */}
        <div className="sb-hero-stats-strip">
          <div className="container">
            <div className="sb-hero-stats-grid">
              <div className="sb-hero-stat">
                <span className="sb-hero-stat-value">3,800+</span>
                <span className="sb-hero-stat-label">Happy customers</span>
              </div>
              <div className="sb-hero-stat-divider" aria-hidden="true" />
              <div className="sb-hero-stat">
                <span className="sb-hero-stat-value">★ 5.0</span>
                <span className="sb-hero-stat-label">Average rating</span>
              </div>
              <div className="sb-hero-stat-divider" aria-hidden="true" />
              <div className="sb-hero-stat">
                <span className="sb-hero-stat-value">Instant</span>
                <span className="sb-hero-stat-label">Digital download</span>
              </div>
              <div className="sb-hero-stat-divider" aria-hidden="true" />
              <div className="sb-hero-stat">
                <span className="sb-hero-stat-value">⭐ Star Seller</span>
                <span className="sb-hero-stat-label">Etsy badge</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wave transition to white below */}
        <div className="sb-hero-wave" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 56"
            preserveAspectRatio="none"
          >
            <path
              fill="#ffffff"
              d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z"
            />
          </svg>
        </div>
      </section>

      {/* Trust pills moved below the hero so they span full width */}
      <div className="sb-hero-trust-section">
        <div className="container">
          <div className="sb-hero-trust-inline">
            <TrustBar items={trust} />
          </div>
        </div>
      </div>

      {/* ====== HOW IT WORKS ====== */}
      <section className="sb-section sb-how-it-works">
        <div className="container">
          <div className="text-center mb-5">
            <span className="sb-section-eyebrow">
              Simple, convenient and affordable
            </span>
            <h2>Download. Print. Done.</h2>
            <p className="sb-muted" style={{ maxWidth: 460, margin: "0 auto" }}>
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
              <h3>Download &amp; use today</h3>
              <p className="sb-muted">
                Instant PDF or editable file — print it or fill it in digitally,
                right away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {featureFlags.showFreeGuideButton && (
        <section className="sb-section sb-section-alt">
          <div className="container">
            <div className="sb-lead-magnet-card sb-card p-4">
              <div className="row align-items-center g-4">
                <div className="col-lg-6">
                  <h2 style={{ fontWeight: 700 }}>Get your free guide</h2>
                  <p className="sb-muted mb-3">
                    AI for Small Business, Learn to Save Time, Cut Costs and
                    Grow Your Business Smarter.
                  </p>
                  <ul
                    className="sb-muted mb-0"
                    style={{ paddingLeft: 0, listStyle: "none" }}
                  >
                    <li style={{ marginBottom: "0.35rem" }}>
                      ✓ Instant download link
                    </li>
                    <li style={{ marginBottom: "0.35rem" }}>
                      ✓ How to use AI tools like Chat GPT
                    </li>
                    <li style={{ marginBottom: "0.35rem" }}>
                      ✓ Simple, step-by-step setups that could save hours every
                      week
                    </li>
                    <li style={{ marginBottom: "0.5rem" }}>
                      ✓ No spam — just helpful tips & new releases
                    </li>
                    <li>✓ Occasional subscriber-only discounts</li>
                  </ul>
                </div>
                <div className="col-lg-6">
                  <EmailCaptureForm source="home-lead-magnet" />
                  <div className="sb-muted mt-2" style={{ fontSize: 13 }}>
                    By subscribing you agree to receive emails. Unsubscribe
                    anytime.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ====== WHAT IS SIMPLE BIZ TOOLKIT ====== */}
      <section className="sb-section" aria-labelledby="sb-about-heading">
        <div className="container">
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            <span className="sb-section-eyebrow">About</span>
            <h2 id="sb-about-heading" style={{ fontWeight: 700 }}>
              What is Simple Biz Toolkit?
            </h2>
            <p className="sb-muted">
              Simple Biz Toolkit provides practical business tools and
              ready-to-use templates designed to help small business owners and
              online sellers stay organised and save time. Trusted by over 3,500
              customers worldwide, with a 5.0 average rating and Etsy Star
              Seller status, we focus on creating simple solutions that make
              everyday business tasks easier.
            </p>
            <p className="sb-muted mb-0">
              Our collection includes printable PDFs, fillable PDFs, and
              easy-to-use business tools covering accounting ledgers, invoices,
              estimates and quotes, timesheets, rent payment records, expense
              trackers, petty cash logs, sign-in sheets, meeting notes, order
              forms, business trackers, and service records. Everything is
              designed to be straightforward, reusable, and available instantly.
              We help business owners spend less time managing paperwork and
              more time running their business.
            </p>
          </div>
        </div>
      </section>

      {/* ====== WHO IT'S FOR ====== */}
      <section
        className="sb-section sb-section-alt"
        aria-labelledby="sb-personas-heading"
      >
        <div className="container">
          <div className="text-center mb-4">
            <span className="sb-section-eyebrow">Who it&apos;s for</span>
            <h2 id="sb-personas-heading" style={{ fontWeight: 700 }}>
              Built for the people running the business
            </h2>
            <p className="sb-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
              Our customers tell us they reach for a printable template when
              software feels like overkill. Here&apos;s who that usually is.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-md-6 col-lg-3">
              <div className="sb-card p-3 h-100">
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Small business owners
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Track income, expenses and invoices on paper or PDF — without
                  paying for accounting software you only half-use.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-card p-3 h-100">
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Online sellers
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Etsy, eBay and Shopify sellers use our order forms, profit
                  trackers and ledgers to stay on top of fees, shipping costs
                  and monthly margins.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-card p-3 h-100">
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Freelancers &amp; solopreneurs
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Send estimates, log time sheets and produce simple invoices
                  without rebuilding a document for every client.
                </p>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="sb-card p-3 h-100">
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Landlords &amp; managers
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Rent payment ledgers, attendance records and sign-in sheets
                  for properties, clubs, schools, salons and small teams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== POPULAR PRODUCTS ====== */}
      <section className="sb-section sb-products-section">
        <div className="container">
          <div className="text-center sb-products-head">
            <span className="sb-section-eyebrow">Best Sellers</span>
            <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
              Our Popular Templates
            </h2>
            <p
              className="sb-muted"
              style={{ maxWidth: 480, margin: "0 auto 2rem" }}
            >
              Our best selling and most popular templates. Ready to download,
              print and use.
            </p>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* ====== VALUE PROPS ====== */}
      <section className="sb-section sb-section-alt">
        <div className="container">
          <div className="text-center mb-4">
            <span className="sb-section-eyebrow">Why Simple Biz Toolkit?</span>
            <h2 style={{ fontWeight: 700 }}>Designed to be simple</h2>
            <p className="sb-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
              Clear layouts, printable formats, and essential categories,
              everything a small business needs.
            </p>
          </div>

          <div className="sb-card p-4">
            <div className="row g-4">
              <div className="col-md-4 sb-animate-fade-in-delay-1">
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
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Essential templates
                  </h3>
                  <p
                    className="sb-muted mb-0"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    Tracking, planning, and admin, without overcomplication.
                  </p>
                </div>
              </div>
              <div className="col-md-4 sb-animate-fade-in-delay-2">
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
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Simple systems
                  </h3>
                  <p
                    className="sb-muted mb-0"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    Repeatable formats that keep you consistent and efficient.
                  </p>
                </div>
              </div>
              <div className="col-md-4 sb-animate-fade-in-delay-3">
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
                  <h3
                    style={{
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Real-world use
                  </h3>
                  <p
                    className="sb-muted mb-0"
                    style={{ fontSize: "0.9375rem" }}
                  >
                    Made for small business owners, solopreneurs, and online
                    sellers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section className="sb-section">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3 sb-testimonial-header">
            <div>
              <span className="sb-section-eyebrow">Testimonials</span>
              <h2 style={{ fontWeight: 700 }}>What customers say</h2>
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
            <EtsyCtaButton label="Browse the full shop" />
          </div>
        </div>
      </section>

      {/* ====== POPULAR CATEGORIES (internal linking) ====== */}
      <section
        className="sb-section sb-section-alt"
        aria-labelledby="sb-categories-heading"
      >
        <div className="container">
          <div className="text-center mb-4">
            <span className="sb-section-eyebrow">Browse by need</span>
            <h2 id="sb-categories-heading" style={{ fontWeight: 700 }}>
              Popular template categories
            </h2>
            <p className="sb-muted" style={{ maxWidth: 600, margin: "0 auto" }}>
              Jump straight to the workflow you need. Every category includes
              both A4 and US Letter formats.
            </p>
          </div>
          <div className="row g-3">
            {[
              {
                href: "/templates/accounting-ledger",
                title: "Accounting ledger templates",
                blurb:
                  "Track income, expenses and running balances on printable monthly or yearly sheets.",
              },
              {
                href: "/templates/invoices",
                title: "Invoice templates",
                blurb:
                  "Send clean, professional invoices in minutes — printable and fillable PDF options.",
              },
              {
                href: "/templates/estimates",
                title: "Estimate &amp; quote templates",
                blurb:
                  "Quick fillable PDF quotes for service businesses, freelancers and contractors.",
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
                title: "Expense &amp; spending trackers",
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
                title: "Order forms &amp; trackers",
                blurb:
                  "Take, fulfil and track orders for handmade, print-on-demand and small e-commerce shops.",
              },
            ].map((cat) => (
              <div className="col-md-6 col-lg-3" key={cat.href}>
                <Link
                  href={cat.href}
                  className="sb-content-link d-block h-100 text-reset text-decoration-none"
                >
                  <article className="sb-card p-3 h-100">
                    <h3
                      style={{
                        fontWeight: 700,
                        fontSize: "1.0625rem",
                        marginBottom: "0.35rem",
                      }}
                      dangerouslySetInnerHTML={{ __html: cat.title }}
                    />
                    <p
                      className="sb-muted mb-0"
                      style={{ fontSize: "0.9375rem" }}
                    >
                      {cat.blurb}
                    </p>
                  </article>
                </Link>
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

      {/* ====== FAQ (Schema-rich) ====== */}
      <section className="sb-section" aria-labelledby="sb-home-faq-heading">
        <div className="container">
          <div className="text-center mb-4">
            <span className="sb-section-eyebrow">Common questions</span>
            <h2 id="sb-home-faq-heading" style={{ fontWeight: 700 }}>
              Frequently asked questions
            </h2>
          </div>
          <div style={{ maxWidth: 880, margin: "0 auto" }}>
            {homeFaqItems.map((item) => (
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
            <div className="text-center mt-3">
              <Link href="/faq" className="btn sb-btn-ghost">
                See all FAQs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
