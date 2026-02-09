import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import FaqAccordion from "@/components/FaqAccordion";
import { faqs } from "@/data/faqs";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about downloads, printing, and using the templates.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | Simple Biz Toolkit",
    description:
      "Common questions about downloads, printing, and using the templates.",
    url: "/faq",
  },
};

export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: site.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "FAQ",
        item: `${site.url}/faq`,
      },
    ],
  };

  return (
    <>
      <JsonLd json={faqJsonLd} />
      <JsonLd json={breadcrumbJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="products-header">
            <h1 style={{ fontWeight: 900 }}>FAQ</h1>
            <p className="sb-muted">
              Answers to common questions about downloads and usage.
            </p>
          </div>

          <div className="row g-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
            <main className="col-12 col-lg-8">
              <FaqAccordion />
            </main>

            <aside className="col-12 col-lg-4">
              <div className="card">
                <div className="card-body d-flex flex-column">
                  <h3 className="h6" style={{ fontWeight: 800 }}>
                    Need more help?
                  </h3>
                  <p className="sb-muted mb-3">
                    If the FAQ doesn't answer your question you can contact us
                    and we'll get back to you.
                  </p>

                  <Link href="/contact" className="btn btn-primary mt-auto">
                    Contact page
                  </Link>

                  <hr />
                  <h4 className="h6">Helpful links</h4>
                  <ul className="list-unstyled sb-muted small">
                    <li>
                      <Link href="/help">Help & Troubleshooting</Link>
                    </li>
                    <li>
                      <a href="https://www.etsy.com/">Etsy Help</a>
                    </li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
