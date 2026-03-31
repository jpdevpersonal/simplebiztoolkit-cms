import Link from "next/link";
import { links } from "@/config/links";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="sb-footer">
      {/* Top bar with trust signals */}
      <div className="sb-footer-trust-bar">
        <div className="container">
          <div className="sb-footer-trust-inner">
            <span className="sb-footer-trust-item">⭐ 5.0 Star Rating</span>
            <span className="sb-footer-trust-divider" aria-hidden="true" />
            <span className="sb-footer-trust-item">🏆 Etsy Star Seller</span>
            <span className="sb-footer-trust-divider" aria-hidden="true" />
            <span className="sb-footer-trust-item">🔒 Secure Checkout</span>
            <span className="sb-footer-trust-divider" aria-hidden="true" />
            <span className="sb-footer-trust-item">⚡ Instant Download</span>
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="sb-footer-main">
        <div className="container">
          <div className="sb-footer-grid">
            {/* Brand column */}
            <div className="sb-footer-brand">
              <div className="sb-footer-brand-name">Simple Biz Toolkit</div>
              <p className="sb-footer-brand-desc">
                Essential templates &amp; tools for small business owners. Save
                time, stay organised, and focus on what matters.
              </p>
              <p className="sb-footer-contact">
                <a
                  href={links.etsyShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Etsy messages
                </a>{" "}
                · simplebiztoolkit@gmail.com
              </p>
            </div>

            {/* Quick Links */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Shop</h4>
              <nav className="sb-footer-nav">
                <Link href="/products">All Templates</Link>
                <a
                  href={links.etsyShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Etsy Shop
                </a>
                <Link href="/testimonials">Reviews</Link>
              </nav>
            </div>

            {/* Help */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Support</h4>
              <nav className="sb-footer-nav">
                <Link href="/faq">FAQ</Link>
                <Link href="/help">Help</Link>
                <Link href="/contact">Contact</Link>
              </nav>
            </div>

            {/* Company */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Company</h4>
              <nav className="sb-footer-nav">
                <Link href="/about">About</Link>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="sb-footer-bottom">
        <div className="container">
          <p>© {year} Simple Biz Toolkit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
