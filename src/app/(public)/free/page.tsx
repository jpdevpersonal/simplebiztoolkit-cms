import type { Metadata } from "next";
import Image from "next/image";

import EmailCaptureForm from "@/components/EmailCaptureForm";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import { featureFlags } from "@/config/featureFlags";

export const metadata: Metadata = {
  title: "Free AI Guide",
  description:
    "Get your free guide delivered by email. Start grow you business smarter.",
  alternates: { canonical: "/free" },
  openGraph: {
    title: "Free AI Guide | Simple Biz Toolkit",
    description:
      "Get your free guide delivered by email. Start grow you business smarter.",
    url: "/free",
  },
};

export default function FreebiePage() {
  if (!featureFlags.showFreeGuideButton) {
    return (
      <section className="sb-section">
        <div className="container">
          <div
            className="text-center"
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              padding: "4rem 1rem",
            }}
          >
            <h1
              style={{
                fontWeight: 900,
                fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
                marginBottom: "1rem",
              }}
            >
              Free Products
            </h1>
            <p
              className="sb-muted"
              style={{
                fontSize: "1.125rem",
                marginBottom: "2rem",
              }}
            >
              We are not currently offering any free products, please try again
              soon.
            </p>
            <div className="d-flex gap-2 flex-wrap justify-content-center">
              <EtsyCtaButton />
              <a className="btn sb-btn-ghost" href="/products">
                Browse All Products
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sb-section">
      <div className="container">
        {/* Hero Header */}
        <div className="text-center mb-5">
          <h1
            style={{
              fontWeight: 900,
              fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
              marginBottom: "0.75rem",
            }}
          >
            Use AI for Your Small Business
          </h1>
          <p
            className="sb-muted"
            style={{
              fontSize: "1.125rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Learn to Save Time, Cut Costs and Grow Your Business Smarter, no
            tech skills required.
          </p>
        </div>

        <div className="row g-4 g-lg-5 align-items-start">
          {/* Left Column - Image Preview */}
          <div className="col-lg-6 order-2 order-lg-1">
            <div
              className="sb-card p-3 p-md-4"
              style={{
                background:
                  "linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%)",
                border: "2px solid var(--accent)",
              }}
            >
              <Image
                src="/images/products/guides/ai-for-small-business.webp"
                className="img-fluid rounded-3"
                alt="AI for Small Business Guide Preview"
                width={1200}
                height={800}
                priority
                style={{
                  maxHeight: 480,
                  width: "100%",
                  objectFit: "contain",
                  filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))",
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 992px) 80vw, 520px"
              />
            </div>

            {/* Social Proof */}
            <div
              className="d-flex align-items-center justify-content-center gap-3 mt-3"
              style={{ fontSize: "0.875rem" }}
            >
              <span className="sb-muted">⭐⭐⭐⭐⭐</span>
              <span className="sb-muted">
                Loved by over 3500 buyers on Etsy
              </span>
            </div>
          </div>

          {/* Right Column - Benefits & Form */}
          <div className="col-lg-6 order-1 order-lg-2">
            <div className="sb-card p-4">
              <h2
                style={{ fontWeight: 800, marginBottom: "1rem" }}
                className="h5"
              >
                What's Inside This Free Guide
              </h2>
              <ul
                style={{
                  paddingLeft: 0,
                  listStyle: "none",
                  marginBottom: "1.5rem",
                }}
              >
                {[
                  "How to use AI tools like ChatGPT effectively",
                  "Step-by-step setups that save hours every week",
                  "Prompt engineering tricks for better results",
                  "Real small business case studies",
                  "Cost-saving marketing strategies",
                  "Future-proof trends to stay ahead",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="d-flex align-items-start gap-2"
                    style={{
                      marginBottom: "0.75rem",
                      fontSize: "0.95rem",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--accent)",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="sb-lead-magnet-card sb-card p-4 mt-3"
              style={{
                border: "2px solid var(--accent)",
                background:
                  "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)",
              }}
            >
              <h3
                style={{ fontWeight: 800, marginBottom: "0.5rem" }}
                className="h5"
              >
                📬 Get Instant Access
              </h3>
              <p className="sb-muted mb-3" style={{ fontSize: "0.9rem" }}>
                Enter your email and we'll send the guide straight to your
                inbox.
              </p>
              <EmailCaptureForm source="freebie-page" />

              <div className="mt-4 d-flex gap-2 flex-wrap">
                <EtsyCtaButton
                  label="Shop More on Etsy"
                  className="flex-grow-1 justify-content-center"
                />
                <a
                  className="btn sb-btn-ghost flex-grow-1 justify-content-center"
                  href="/products"
                >
                  Browse All Products
                </a>
              </div>

              <p
                className="sb-muted text-center mt-3 mb-0"
                style={{ fontSize: "0.75rem" }}
              >
                🔒 No spam, ever. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
