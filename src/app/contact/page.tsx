import type { Metadata } from "next";

import { links } from "@/config/links";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get support via Etsy messages or email.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Simple Biz Toolkit",
    description: "Get support via Etsy messages or email.",
    url: "/contact",
  },
};

export default function ContactPage() {
  return (
    <section className="sb-section">
      <div className="container">
        <div className="products-header">
          <h1 style={{ fontWeight: 900 }}>Contact</h1>
          <p className="sb-muted">
            Fastest support is via Etsy messages. Email is available too.
          </p>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <div className="sb-card p-4 h-100">
                <div style={{ fontWeight: 900 }}>
                  Etsy messages (recommended)
                </div>
                <p className="sb-muted mb-3">
                  Best for order-related questions.
                </p>
                <a
                  className="btn sb-btn-primary"
                  href={links.etsyShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Message on Etsy
                </a>
              </div>
            </div>
            <div className="col-md-6">
              <div className="sb-card p-4 h-100">
                <div style={{ fontWeight: 900 }}>Email</div>
                <p className="sb-muted mb-0">simplebiztoolkit@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
