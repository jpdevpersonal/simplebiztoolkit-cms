import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import EmailCaptureForm from "@/components/EmailCaptureForm";
import EtsyCtaButton from "@/components/EtsyCtaButton";
import { featureFlags } from "@/config/featureFlags";
import { formatTrustCount, site } from "@/config/site";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";

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
  const sales = formatTrustCount(site.trust.salesCount);

  if (!featureFlags.showFreeGuideButton) {
    return (
      <section className="sb-section">
        <div className="container">
          <div className="sb-free-empty">
            <h1>Free Templates</h1>
            <p className="lead">
              We are not currently offering any free templates, please try again
              soon.
            </p>
            <div className="d-flex gap-2 flex-wrap justify-content-center">
              <EtsyCtaButton />
              <Link className="btn sb-btn-ghost" href="/templates">
                Browse All Templates
              </Link>
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
        <div className="sb-page-header">
          <span className="sb-section-eyebrow">Free guide</span>
          <h1>Use AI for Your Small Business</h1>
          <p>
            Learn to Save Time, Cut Costs and Grow Your Business Smarter, no
            tech skills required.
          </p>
        </div>

        <div className="row g-4 g-lg-5 align-items-start">
          {/* Left Column - Image Preview */}
          <div className="col-lg-6 order-2 order-lg-1">
            <div className="sb-free-preview">
              <Image
                src="/images/products/guides/ai-for-small-business.webp"
                className="sb-free-preview-image"
                alt="AI for Small Business Guide Preview"
                width={1200}
                height={800}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 992px) 80vw, 520px"
                unoptimized={shouldBypassNextImageOptimization(
                  "/images/products/guides/ai-for-small-business.webp",
                )}
              />
            </div>

            {/* Social Proof */}
            <div className="sb-free-proof">
              <span aria-hidden="true">★★★★★</span>
              <span>Loved by {sales} buyers on Etsy</span>
            </div>
          </div>

          {/* Right Column - Benefits & Form */}
          <div className="col-lg-6 order-1 order-lg-2">
            <div className="sb-card p-4">
              <h2 className="h5">What&apos;s Inside This Free Guide</h2>
              <ul className="sb-free-benefits">
                {[
                  "How to use AI tools like ChatGPT effectively",
                  "Step-by-step setups that save hours every week",
                  "Prompt engineering tricks for better results",
                  "Real small business case studies",
                  "Cost-saving marketing strategies",
                  "Future-proof trends to stay ahead",
                ].map((item, i) => (
                  <li key={i}>
                    <span className="sb-free-check" aria-hidden="true">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sb-lead-magnet-card sb-free-form-card sb-card p-4 mt-3">
              <h3 className="h5">Get instant access</h3>
              <p className="sb-muted sb-small-copy mb-3">
                Enter your email and we&apos;ll send the guide straight to your
                inbox.
              </p>
              <EmailCaptureForm source="freebie-page" />

              <div className="mt-4 d-flex gap-2 flex-wrap">
                <EtsyCtaButton
                  label="Shop More on Etsy"
                  className="flex-grow-1 justify-content-center"
                />
                <Link
                  className="btn sb-btn-ghost flex-grow-1 justify-content-center"
                  href="/templates"
                >
                  Browse All Templates
                </Link>
              </div>

              <p className="sb-muted sb-text-xs text-center mt-3 mb-0">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
