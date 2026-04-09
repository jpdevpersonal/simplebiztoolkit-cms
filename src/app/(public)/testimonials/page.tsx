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
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.875rem, 4.5vw, 3rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              background:
                "linear-gradient(135deg, var(--sb-ink) 0%, var(--sb-brand-blue-light) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: 0,
            }}
          >
            Reviews
          </h1>
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 3,
              background:
                "linear-gradient(90deg, var(--sb-green), var(--sb-brand-blue))",
              borderRadius: 999,
              margin: "0.875rem auto 1rem",
            }}
          />
          <p className="sb-muted" style={{ maxWidth: 520, margin: "0 auto" }}>
            Here&apos;s what some of our customers are saying about Simple Biz
            Toolkit
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
  );
}
