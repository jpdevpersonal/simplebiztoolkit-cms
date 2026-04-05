import Link from "next/link";
import { links } from "@/config/links";
import {
  composeOrderedMenuEntries,
  getOrderedMenuEntryHref,
  type MenuNavItem,
} from "../lib/siteMenu";

type FooterLink = {
  id: string;
  href: string;
  label: string;
};

type Props = {
  menuNavItems?: MenuNavItem[];
  navOrderIds?: string[];
};

export default function SiteFooter({
  menuNavItems = [],
  navOrderIds = [],
}: Props) {
  const year = new Date().getFullYear();
  const managedFooterEntries = composeOrderedMenuEntries(
    menuNavItems,
    navOrderIds,
  )
    .map((entry) => ({
      id: entry.orderId,
      href: getOrderedMenuEntryHref(entry),
      label: entry.kind === "static" ? entry.label : entry.item.title,
      kind: entry.kind,
    }))
    .filter(
      (
        entry,
      ): entry is FooterLink & {
        kind: "static" | "cms";
      } => Boolean(entry.href),
    );

  const staticEntries = managedFooterEntries.filter(
    (entry) => entry.kind === "static",
  );
  const exploreEntries = managedFooterEntries.filter(
    (entry) => entry.kind === "cms",
  );

  function getStaticLink(path: string): FooterLink | undefined {
    return staticEntries.find((entry) => entry.href === path);
  }

  const shopLinks = [
    getStaticLink("/templates"),
    getStaticLink("/testimonials"),
  ].filter((entry): entry is FooterLink => Boolean(entry));
  const supportLinks = [
    getStaticLink("/faq"),
    getStaticLink("/help"),
    getStaticLink("/contact"),
  ].filter((entry): entry is FooterLink => Boolean(entry));
  const companyLinks = [getStaticLink("/about")].filter(
    (entry): entry is FooterLink => Boolean(entry),
  );

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

            {/* Shop */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Shop</h4>
              <nav className="sb-footer-nav">
                {shopLinks.map((entry) => (
                  <Link key={entry.id} href={entry.href}>
                    {entry.label}
                  </Link>
                ))}
                <a
                  href={links.etsyShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Etsy Shop
                </a>
              </nav>
            </div>

            {/* Support */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Support</h4>
              <nav className="sb-footer-nav">
                {supportLinks.map((entry) => (
                  <Link key={entry.id} href={entry.href}>
                    {entry.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Company */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Company</h4>
              <nav className="sb-footer-nav">
                {companyLinks.map((entry) => (
                  <Link key={entry.id} href={entry.href}>
                    {entry.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Explore */}
            <div className="sb-footer-col">
              <h4 className="sb-footer-heading">Explore</h4>
              <nav className="sb-footer-nav">
                {exploreEntries.map((entry) => (
                  <Link key={entry.id} href={entry.href}>
                    {entry.label}
                  </Link>
                ))}
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
