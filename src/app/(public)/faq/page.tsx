import type { Metadata } from "next";

import JsonLd from "@/components/JsonLd";
import FaqAccordion from "@/components/FaqAccordion";
import SupportSidebarCard from "@/components/SupportSidebarCard";
import "@/styles/faq.css";
import { apiService, type Faq } from "@/lib/api";
import { stripHtml } from "@/lib/sanitize";
import { site } from "@/config/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Frequently asked Questions (FAQ) | Simple Biz Toolkit",
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

export default async function FaqPage() {
  const response = await apiService.getFaqs();
  const faqs: Faq[] = response.data ?? [];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: stripHtml(faq.a || ""),
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
      {faqs.length > 0 && <JsonLd json={faqJsonLd} />}
      <JsonLd json={breadcrumbJsonLd} />
      <section className="sb-section">
        <div className="container">
          <div className="products-header">
            <h1 style={{ fontWeight: 900 }}>Frequently Asked Questions</h1>
          </div>

          <div className="row g-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
            <main className="col-12 col-lg-8">
              <FaqAccordion faqs={faqs} />
            </main>

            <aside className="col-12 col-lg-4">
              <SupportSidebarCard
                description="If the FAQ doesn't answer your question you can contact us and we'll get back to you."
                linksHeading="Helpful links"
                links={[
                  {
                    href: "https://www.etsy.com/",
                    label: "Etsy Help",
                    external: true,
                  },
                ]}
              />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
