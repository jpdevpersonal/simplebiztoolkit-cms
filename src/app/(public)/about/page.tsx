import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import { createAboutPageJsonLd, createBreadcrumbJsonLd } from "@/lib/seo";
import "@/styles/aboutStyle.css";

export const metadata: Metadata = {
  title: "About Simple Biz Toolkit",
  description:
    "Simple Biz Toolkit offers business templates and browser-based tools for small businesses, online sellers, freelancers and landlords. Template purchases are completed through Etsy.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Simple Biz Toolkit",
    description:
      "Simple Biz Toolkit offers business templates and browser-based tools for small businesses, online sellers, freelancers and landlords. Template purchases are completed through Etsy.",
    url: "/about",
  },
};

export default function AboutPage() {
  const aboutJsonLd = createAboutPageJsonLd({
    name: "About Simple Biz Toolkit",
    description:
      "Simple Biz Toolkit offers business templates and browser-based tools for small business owners, online sellers, freelancers and landlords.",
    href: "/about",
  });

  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
  ]);

  return (
    <>
      <JsonLd json={aboutJsonLd} />
      <JsonLd json={breadcrumbJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="sb-page-header">
            <span className="sb-section-eyebrow">Our studio</span>
            <h1>About Simple Biz Toolkit</h1>
            <p className="sb-muted sb-speakable">
              We offer business templates and browser-based tools for small
              business owners, online sellers, freelancers and landlords.
            </p>
          </div>

          <div className="sb-text-column">
            <div className="sb-prose-panel">
              <section className="p-3 h-100">
                <h2>Who we are</h2>
                <p>
                  Simple Biz Toolkit offers business templates and
                  browser-based tools. Template purchases are completed through
                  Etsy; check individual listings for product details and terms.
                </p>
              </section>

              <section className="p-3 h-100">
                <h2>What we make</h2>
                <p>
                  File formats, paper sizes, compatibility and usage rights can
                  differ between products. Review the product page and Etsy
                  listing before purchase.
                </p>
                <p>
                  Available categories and products may change. Browse the
                  current collection and review each listing for included
                  formats, features and intended use.
                </p>
              </section>

              <section className="p-3 h-100">
                <h2>Why choose us</h2>
                <ul>
                  <li>
                    Product formats, features and usage rights vary; confirm
                    them on the listing before purchase.
                  </li>
                  <li>
                    Template purchases are completed through Etsy.
                  </li>
                </ul>
              </section>

              <section className="p-3 h-100">
                <h2>How we work</h2>
                <p>We sell exclusively through Etsy. That means:</p>
                <ul>
                  <li>
                    Checkout and order access are handled through Etsy.
                  </li>
                  <li>
                    Product availability and delivery details are shown on the
                    Etsy listing.
                  </li>
                  <li>
                    Use the contact options on the listing or order page for
                    product questions.
                  </li>
                </ul>
              </section>

              <section className="p-3 h-100">
                <h2>Our commitment</h2>
                <p>
                  For questions about a product, its files or its terms, contact
                  the shop through Etsy before purchasing.
                </p>

                <p className="mb-0">
                  Julian
                  <br />
                  Founder, Simple Biz Toolkit
                </p>
              </section>

              <section>
                <p className="about-disclosure">
                  Disclosure: This site may contain affiliate links. If you use
                  them, Simple Biz Toolkit may earn a commission at no extra
                  cost to you.
                </p>
              </section>
            </div>

            <div className="mt-4 d-flex gap-2 flex-wrap">
              <Link href="/templates" className="btn sb-btn-primary">
                Browse All Templates
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
