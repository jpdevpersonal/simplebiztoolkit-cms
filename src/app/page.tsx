import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

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
    url: "https://simplebiztoolkit.com",
    logo: "https://simplebiztoolkit.com/images/simple-biz-toolkit-logo.png",
    sameAs: [links.etsyShopUrl],
  };

  return (
    <>
      <JsonLd json={orgJsonLd} />

      {/* ====== HERO ====== */}
      <section className="sb-hero">
        <div className="container">
          <div className="sb-hero-grid">
            {/* Left column: Content */}
            <div className="sb-hero-content">
              {/* Eyebrow trust pill */}
              <span className="sb-hero-eyebrow">
                <span className="sb-hero-eyebrow-dot" aria-hidden="true" />
                Trusted by 3,500+ small business owners
              </span>

              <h1 className="sb-hero-title">
                Templates & tools that make running your business easier
              </h1>

              <p className="sb-hero-subtitle">
                Ready-to-use, printable downloads that cut admin time, keep you
                organised, and require zero tech skills.
              </p>

              <div className="sb-hero-actions">
                <Link href="/products" className="btn sb-btn-primary sb-btn-lg">
                  Browse All Products
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
              </div>

              {/* Compact trust bar (moved below hero for full-width layout) */}
            </div>

            {/* Right column: Image */}
            <div className="sb-hero-showcase">
              <Image
                src="/images/hero-image-desk.webp"
                alt="Tools for your small business"
                className="sb-hero-img"
                width={1200}
                height={800}
                priority
                loading="eager"
              />
            </div>
          </div>
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

      <section className="sb-section">
        <div className="text-center" style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
            Popular Templates
          </h2>
          <p className="sb-muted" style={{ maxWidth: 480, margin: "0 auto" }}>
            Our most popular requests and best-sellers — ready to download and
            print.
          </p>

          <ProductGrid products={featuredProducts} />
        </div>

        <section className="sb-section sb-section-alt">
          <div className="container">
            <div className="text-center mb-4">
              <span className="sb-section-eyebrow">
                Why Simple Biz Toolkit?
              </span>
              <h2 style={{ fontWeight: 700 }}>Designed to be simple</h2>
              <p
                className="sb-muted"
                style={{ maxWidth: 520, margin: "0 auto" }}
              >
                Clear layouts, printable formats, and essential categories —
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
                      Tracking, planning, and admin — without overcomplication.
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

        <section className="sb-section">
          <div className="container">
            <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3 sb-testimonial-header">
              <div>
                <span className="sb-section-eyebrow">Testamonials</span>
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
      </section>
    </>
  );
}
