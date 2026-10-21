import type { Metadata } from "next";
import Link from "next/link";

import EtsyCtaButton from "@/components/EtsyCtaButton";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Free Templates Currently Unavailable",
  description:
    "There is no free template or email delivery offer available at this time. Free browser-based tools remain available.",
  alternates: { canonical: "/free" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Free Templates Currently Unavailable | Simple Biz Toolkit",
    description:
      "There is no free template or email delivery offer available at this time.",
    url: "/free",
  },
};

export default function FreebiePage() {
  return (
    <section className="sb-section">
      <div className="container">
        <div className="sb-free-empty">
          <h1>Free Templates</h1>
          <p className="lead">
            There is no free download or email offer available right now. Our
            free browser-based tools are still available.
          </p>
          <div className="d-flex gap-2 flex-wrap justify-content-center">
            <Link className="btn sb-btn-primary" href="/tools/profit-calculator">
              Use the free profit calculator
            </Link>
            <Link className="btn sb-btn-ghost" href="/templates">
              Browse All Templates
            </Link>
            <EtsyCtaButton href={site.socialUrls[0]} />
          </div>
        </div>
      </div>
    </section>
  );
}
