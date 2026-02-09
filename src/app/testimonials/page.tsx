import type { Metadata } from "next";

import TestimonialGrid from "@/components/TestimonialGrid";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reviews",
  description:
    "Real customer feedback. Social proof builds trust and improves conversions.",
  alternates: { canonical: "/testimonials" },
  openGraph: {
    title: "Reviews | Simple Biz Toolkit",
    description:
      "Real customer feedback. Social proof builds trust and improves conversions.",
    url: "/testimonials",
  },
};

export default function TestimonialsPage() {
  return (
    <section className="sb-section">
      <div className="container">
        <h1 style={{ fontWeight: 900 }}>Reviews</h1>
        <p className="sb-muted">
          Here's what some of our customers are saying about Simple Biz Toolkit
        </p>

        <TestimonialGrid />

        <div className="text-center mt-4">
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
      </div>
    </section>
  );
}
