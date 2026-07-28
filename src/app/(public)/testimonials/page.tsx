import type { Metadata } from "next";

import JsonLd from "@/components/JsonLd";
import TestimonialGrid from "@/components/TestimonialGrid";
import Link from "next/link";
import { testimonials } from "@/data/testimonials";
import { site } from "@/config/site";
import { createBreadcrumbJsonLd, normalizePublicUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Customer Reviews & Testimonials",
  description: `Read customer reviews of Simple Biz Toolkit printable business templates. Real feedback from buyers across our Etsy shop — ${site.trust.reviewCount.toLocaleString("en-GB")}+ reviews and counting.`,
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Customer Reviews & Testimonials | Simple Biz Toolkit",
    description: `Read customer reviews of Simple Biz Toolkit printable business templates. Real feedback from buyers across our Etsy shop — ${site.trust.reviewCount.toLocaleString("en-GB")}+ reviews and counting.`,
    url: "/testimonials",
  },
};

/**
 * Extract a numeric rating from the leading ⭐ characters in each quote so the
 * Review JSON-LD reflects the displayed rating rather than a hard-coded value.
 */
function extractRating(quote: string): number {
  const match = quote.match(/^[\s\u2B50★]+/);
  const head = match?.[0] ?? "";
  const stars = (head.match(/[\u2B50★]/g) ?? []).length;
  return stars >= 1 && stars <= 5 ? stars : 5;
}

function stripStars(quote: string): string {
  return quote.replace(/^[\s\u2B50★]+/, "").trim();
}

export default function TestimonialsPage() {
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Reviews", href: "/testimonials" },
  ]);

  const reviewListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Customer reviews of Simple Biz Toolkit",
    numberOfItems: testimonials.length,
    itemListElement: testimonials.map((t, index) => {
      const rating = extractRating(t.quote);
      const body = stripStars(t.quote);
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Review",
          author: { "@type": "Person", name: t.name },
          reviewBody: body,
          reviewRating: {
            "@type": "Rating",
            ratingValue: String(rating),
            bestRating: "5",
            worstRating: "1",
          },
          itemReviewed: {
            "@type": "Organization",
            name: site.name,
            url: site.url,
          },
          ...(t.productLink
            ? { url: normalizePublicUrl(t.productLink) ?? undefined }
            : {}),
        },
      };
    }),
  };

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={reviewListJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="sb-page-header">
            <span className="sb-section-eyebrow">Etsy feedback</span>
            <h1>Customer reviews</h1>
            <p className="sb-speakable">
              Real feedback from people using Simple Biz Toolkit printable
              business templates — including small business owners, online
              sellers, freelancers and landlords. Combined with our Etsy shop we
              have over {site.trust.reviewCount.toLocaleString("en-GB")} reviews
              and {site.trust.salesCount.toLocaleString("en-GB")} sales.
            </p>
          </div>

          <TestimonialGrid />

          <div className="text-center mt-4">
            <Link href="/templates" className="btn sb-btn-primary">
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
          </div>
        </div>
      </section>
    </>
  );
}
