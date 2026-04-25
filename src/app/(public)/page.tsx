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

export const metadata: Metadata = {
  title: "Essential Templates & Tools for Small Business Owners",
  description:
    "Trusted printable templates and tools that save time and reduce admin for your small business. Run your business smarter with our guides, then shop securely on Etsy.",
  alternates: { canonical: "/" },
  openGraph: {
    title:
      "Simple Biz Toolkit | Essential Templates & Tools for Small Business Owners",
    description:
      "Trust-first templates and toolkits that save time and reduce admin. Shop securely on Etsy.",
    url: "/",
  },
};

export default function HomePage() {
  const trust = [
    "Five Star Etsy rating",
    "Etsy Star Seller!",
    "Over 3500 sales",
    "Secure checkout via Etsy",
    "Excellent service & support",
  ];

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Simple Biz Toolkit",
    url: "https://www.simplebiztoolkit.com",
    logo: "https://www.simplebiztoolkit.com/images/simple-biz-toolkit-logo.png",
    sameAs: [links.etsyShopUrl],
  };

  return (
    <>
      <JsonLd json={orgJsonLd} />

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
              Trusted by 3,500+ small business owners
            </span>

            <h1 className="sb-hero-title">
              Run your business smarter with templates
              <br />
              <em>that work for you</em>
            </h1>

            <p className="sb-hero-subtitle">
              Ready-to-use, printable downloads designed for small business
              owners. Cut admin time, stay organised, and get back to doing what
              you love.
            </p>

            <div className="sb-hero-stars" aria-label="Five star rated on Etsy">
              <span className="sb-hero-stars-icons" aria-hidden="true">
                ★★★★★
              </span>
              <span className="sb-hero-stars-label">
                <strong>5.0</strong> &middot; 3,700+ five-star reviews on Etsy
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
                <span className="sb-hero-stat-value">3,500+</span>
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
    </>
  );
}
