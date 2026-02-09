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

      <section className="sb-hero">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <div className="sb-hero-content">
                <span className="sb-hero-badge">
                  Trusted by 3,500+ small business owners
                </span>

                <h1 className="sb-hero-title">
                  Essential templates & tools for small business owners
                </h1>

                <p className="sb-hero-subtitle">
                  Simple, ready-to-use downloads that reduce admin, keep you
                  organised, and don’t require tech skills.
                </p>

                <div className="d-flex gap-2 flex-wrap sb-hero-actions">
                  <Link href="/products" className="btn sb-btn-primary">
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

                <div className="sb-hero-trust">
                  <TrustBar items={trust} />
                </div>

                <blockquote className="sb-hero-quote">
                  <div className="sb-hero-quote-text">
                    “Just what I was looking for and could not find. So glad I
                    found these — they print out great!”
                  </div>
                  <cite className="sb-hero-quote-cite">
                    — Becky, Etsy buyer
                  </cite>
                </blockquote>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="hero-image-wrapper d-flex justify-content-center align-items-center">
                <Image
                  src="/images/hero-image-desk.webp"
                  alt="Tools for your small business"
                  className="img-fluid hero-image"
                  width={820}
                  height={547}
                  priority
                  loading="eager"
                />
              </div>
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

      <section className="sb-section">
        <div className="container">
          <h2
            className="text-center"
            style={{ fontWeight: 700, marginBottom: "0.5rem" }}
          >
            Popular Templates
          </h2>
          <p className="text-center sb-muted mb-4">
            Take a look at some of our most popular requests and best-sellers.
          </p>

          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <section className="sb-section sb-section-alt">
        <div className="container">
          <div className="text-center mb-4">
            <h2 style={{ fontWeight: 700 }}>Designed to be simple</h2>
            <p className="sb-muted">
              Clear layouts, printable formats, and essential categories.
            </p>
          </div>

          <div className="row g-3">
            <div className="col-md-4 sb-animate-fade-in-delay-1">
              <div className="sb-value-card">
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Essential templates
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Tracking, planning, and admin, without overcomplication.
                </p>
              </div>
            </div>
            <div className="col-md-4 sb-animate-fade-in-delay-2">
              <div className="sb-value-card">
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Simple systems
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Repeatable formats that keep you consistent.
                </p>
              </div>
            </div>
            <div className="col-md-4 sb-animate-fade-in-delay-3">
              <div className="sb-value-card">
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  Real-world use
                </h3>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  Made for small business owners, solopreneurs, and online
                  sellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sb-section">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between flex-wrap gap-2 mb-3 sb-testimonial-header">
            <div>
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
