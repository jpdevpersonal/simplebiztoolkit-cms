import type { Metadata } from "next";

import JsonLd from "@/components/JsonLd";
import FaqAccordion from "@/components/FaqAccordion";
import { ActionPanel, PageHero, TopicCards } from "@/components/PageHero";
import "@/styles/bootstrap-public-components.scss";
import "@/styles/faq.css";
import { apiService, type Faq } from "@/lib/api";
import { stripHtml } from "@/lib/sanitize";
import { site } from "@/config/site";
import { groupFaqs } from "@/lib/faqGroups";

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
  const groups = groupFaqs(faqs);

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
          <PageHero
            badge="💬"
            eyebrow="Help centre"
            title="Frequently Asked Questions"
            intro={
              <p>
                Quick, friendly answers about downloading, printing and using
                Simple Biz Toolkit templates. Pick a topic or search below.
              </p>
            }
            meta={
              faqs.length > 0
                ? `${faqs.length} answers across ${groups.length} topic${groups.length === 1 ? "" : "s"}`
                : undefined
            }
          >
            {groups.length > 1 && (
              <TopicCards
                ariaLabel="FAQ topics"
                topics={groups.map((group) => ({
                  href: `#${group.id}`,
                  title: group.group,
                  note: `${group.faqs.length} question${group.faqs.length === 1 ? "" : "s"}`,
                }))}
              />
            )}
          </PageHero>

          <div className="sb-faq-layout sb-faq-layout--centred">
            <FaqAccordion faqs={faqs} groupHeadings={groups.length > 1} />
          </div>

          <ActionPanel
            id="faq-help-heading"
            title="Didn't find your answer?"
            text="We're happy to help. Choose the option that fits your question."
            options={[
              {
                href: "/help",
                title: "Download help",
                text: "Step-by-step help finding, opening and printing files",
                icon: "download",
              },
              {
                href: "/contact",
                title: "Contact us",
                text: "Send us a message and we'll get back to you",
                icon: "mail",
              },
              {
                href: "https://www.etsy.com/",
                title: "Etsy Help",
                text: "Account, payment and order questions for Etsy",
                icon: "bag",
                external: true,
              },
            ]}
          />
        </div>
      </section>
    </>
  );
}
