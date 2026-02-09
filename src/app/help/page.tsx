import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help",
  description:
    "How to find and download your purchases, plus common help topics.",
  alternates: { canonical: "/help" },
  openGraph: {
    title: "Help | Simple Biz Toolkit",
    description:
      "How to find and download your purchases, plus common help topics.",
    url: "/help",
  },
};

export default function HelpPage() {
  return (
    <section className="sb-section">
      <div className="container">
        <div className="products-header">
          <h1 style={{ fontWeight: 900 }}>Help</h1>
          <p className="sb-muted">Help for common questions about purchases.</p>
        </div>

        <div className="row g-4" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <main className="col-12 col-lg-8">
            <div className="card mb-3">
              <div className="card-body">
                <h2 className="h4">Finding your digital downloads</h2>
                <p className="sb-muted">
                  If you purchased using your Etsy account, open Purchases and
                  Reviews, your items have a "Download Files" button next to
                  them.
                </p>

                <div className="mt-3">
                  <h3 className="h5">Troubleshooting steps</h3>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item">
                      <strong>Use a web browser:</strong> Desktop or
                      desktop-view is recommended for downloads.
                    </li>
                    <li className="list-group-item">
                      <strong>Check payment status:</strong> If the download
                      button is grey, payment may still be processing.
                    </li>
                    <li className="list-group-item">
                      <strong>Disable ad blockers:</strong> Extensions can stop
                      downloads from triggering.
                    </li>
                    <li className="list-group-item">
                      <strong>Clear cache/cookies:</strong> Try a different
                      browser or clear your browsing data and retry.
                    </li>
                    <li className="list-group-item">
                      <strong>Check email:</strong> Guest purchases include a
                      direct download link in the receipt email.
                    </li>
                  </ul>
                </div>

                <div className="mt-3">
                  <h3 className="h5">Still stuck?</h3>
                  <p className="sb-muted">
                    If issues persist, message the seller via Etsy — they can
                    also email your files directly.
                  </p>
                </div>
              </div>
            </div>
          </main>

          <aside className="col-12 col-lg-4">
            <div className="card">
              <div className="card-body d-flex flex-column">
                <h3 className="h6" style={{ fontWeight: 800 }}>
                  Need more help?
                </h3>
                <p className="sb-muted mb-3">
                  Contact us for additional assistance or questions about
                  downloads and orders.
                </p>
                <Link href="/contact" className="btn btn-primary mt-auto">
                  Contact page
                </Link>

                <hr />

                <h4 className="h6">Quick links</h4>
                <ul className="list-unstyled sb-muted small">
                  <li>
                    <Link href="/faq">FAQ</Link>
                  </li>
                  <li>
                    <a href="https://www.help.etsy.com/">Etsy Help</a>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
