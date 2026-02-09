import Link from "next/link";
import { links } from "@/config/links";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: "1px solid var(--sb-border)",
        background: "var(--sb-soft)",
      }}
    >
      <div className="container py-5 d-flex flex-column flex-lg-row justify-content-between gap-4">
        <div>
          <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
            Simple Biz Toolkit
          </div>
          <p className="sb-muted mb-2" style={{ maxWidth: "280px" }}>
            Essential templates & tools for small business owners.
          </p>
          <p className="sb-muted mb-0" style={{ fontSize: "0.8125rem" }}>
            Support:{" "}
            <a
              href={links.etsyShopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Etsy messages
            </a>{" "}
            or <strong>simplebiztoolkit@gmail.com</strong>
          </p>
        </div>

        <nav
          className="d-flex gap-3 flex-wrap align-items-start justify-content-lg-end"
          style={{ fontSize: "0.9375rem" }}
        >
          <Link href="/products">Products</Link>
          <Link href="/blog">Resources</Link>
          <Link href="/testimonials">Reviews</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/help">Help</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/about">About</Link>
          <a href={links.etsyShopUrl} target="_blank" rel="noopener noreferrer">
            Etsy Shop
          </a>
        </nav>
      </div>
      <div className="container pb-4">
        <p className="sb-muted mb-0" style={{ fontSize: "0.75rem" }}>
          © {year} Simple Biz Toolkit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
