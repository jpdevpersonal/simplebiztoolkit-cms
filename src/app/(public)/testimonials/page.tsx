import type { Metadata } from "next";

import JsonLd from "@/components/JsonLd";
import TestimonialGrid from "@/components/TestimonialGrid";
import Link from "next/link";
import { createBreadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Customer Reviews & Testimonials",
  description:
    "Read selected customer feedback about Simple Biz Toolkit and browse the templates available on Etsy.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Customer Reviews & Testimonials | Simple Biz Toolkit",
    description:
      "Read selected customer feedback about Simple Biz Toolkit and browse the templates available on Etsy.",
    url: "/testimonials",
  },
};

export default function TestimonialsPage() {
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Reviews", href: "/testimonials" },
  ]);

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="sb-page-header">
            <span className="sb-section-eyebrow">Etsy feedback</span>
            <h1>Customer reviews</h1>
            <p className="sb-speakable">
              Selected feedback about Simple Biz Toolkit templates from buyers.
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
