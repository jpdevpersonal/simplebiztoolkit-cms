import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import { createAboutPageJsonLd, createBreadcrumbJsonLd } from "@/lib/seo";
import "@/styles/aboutStyle.css";

export const metadata: Metadata = {
  title: "About Simple Biz Toolkit",
  description:
    "Simple Biz Toolkit is a small independent studio that designs printable PDF templates for small businesses, online sellers, freelancers and landlords — sold instantly via Etsy.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About | Simple Biz Toolkit",
    description:
      "Simple Biz Toolkit is a small independent studio that designs printable PDF templates for small businesses, online sellers, freelancers and landlords — sold instantly via Etsy.",
    url: "/about",
  },
};

export default function AboutPage() {
  const aboutJsonLd = createAboutPageJsonLd({
    name: "About Simple Biz Toolkit",
    description:
      "Simple Biz Toolkit is a small independent studio designing printable PDF business templates sold via Etsy. We focus on clean, affordable forms that small business owners, online sellers, freelancers and landlords can use immediately — no software, no subscription.",
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
          <div className="products-header">
            <h1 style={{ fontWeight: 900 }}>About Simple Biz Toolkit</h1>
            <p className="sb-muted sb-speakable">
              We design printable PDF templates that small business owners,
              online sellers, freelancers and landlords can download and use in
              minutes — no software, no subscription, no surprises.
            </p>
          </div>

          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div className="sb-card p-3">
              <section className="p-3 h-100">
                <h2>Who we are</h2>
                <p>
                  Simple Biz Toolkit is a small independent design studio. We
                  make practical printable business templates — invoices,
                  receipts, ledgers, attendance sheets, rent records, order
                  forms and more — and we sell them as instant digital downloads
                  through our Etsy shop. Every template is built and tested
                  in-house before it goes on sale.
                </p>
                <p>
                  We started Simple Biz Toolkit after seeing how many small
                  businesses, side-hustlers and household landlords struggle
                  with software they don&apos;t need: monthly subscriptions,
                  steep learning curves, and tools designed for much bigger
                  companies. A clean printable form is often all you need to
                  keep your records straight, prove what you sold or received,
                  and look professional in front of customers.
                </p>
              </section>

              <section className="p-3 h-100">
                <h2>What we make</h2>
                <p>
                  Every product on this site is a printable PDF that has been
                  laid out for both A4 and US Letter paper, so it works wherever
                  you are. Many listings include a fillable version you can type
                  into using any free PDF reader, alongside a print-and-write
                  version. Once you buy a template you own your copy permanently
                  — re-download or re-print it as often as you need to.
                </p>
                <p>
                  Categories include accounting ledgers, business ledger
                  bundles, invoices, receipts, estimates, expense and spending
                  trackers, payment trackers, petty cash records, rent payment
                  ledgers, attendance and sign-in sheets, time sheets, order
                  forms, meeting notes, tips and service records, and free
                  guides.
                </p>
              </section>

              <section className="p-3 h-100">
                <h2>Why choose us</h2>
                <ul>
                  <li>
                    <strong>Time-saving solutions</strong> — pre-built layouts
                    that you can use straight away.
                  </li>
                  <li>
                    <strong>Affordable</strong> — professional templates without
                    subscriptions or complex software.
                  </li>
                  <li>
                    <strong>Original designs</strong> — every template is
                    designed in-house, not resold stock.
                  </li>
                  <li>
                    <strong>Versatile</strong> — bookkeeping, planning,
                    customer-facing forms, internal records.
                  </li>
                  <li>
                    <strong>Quality assurance</strong> — clean layouts,
                    print-tested on home and office printers.
                  </li>
                </ul>
              </section>

              <section className="p-3 h-100">
                <h2>How we work</h2>
                <p>We sell exclusively through Etsy. That means:</p>
                <ul>
                  <li>
                    <strong>Secure checkout</strong> handled by Etsy — we never
                    see your card details.
                  </li>
                  <li>
                    <strong>Instant download</strong> straight after payment
                    from your Etsy Purchases and Reviews page.
                  </li>
                  <li>
                    <strong>Permanent access</strong> — your files stay
                    available on your Etsy account so you can re-download any
                    time.
                  </li>
                  <li>
                    <strong>Direct support</strong> — message us through Etsy
                    and we usually reply within one business day.
                  </li>
                </ul>
              </section>

              <section className="p-3 h-100">
                <h2>Our commitment</h2>
                <p>
                  We&apos;re a small team and we read every message. If a
                  template doesn&apos;t print well, doesn&apos;t open, or
                  doesn&apos;t quite fit what you need, message us through Etsy
                  and we will fix it. Your feedback is the most important driver
                  of which templates we build next.
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
              <Link
                href="/templates"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.rem",
                  padding: "0.5rem",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderRadius: "12px",
                  backgroundColor: "white",
                  color: "var(--sb-green)",
                  border: "2px solid var(--sb-green)",
                }}
              >
                Browse All Templates
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
