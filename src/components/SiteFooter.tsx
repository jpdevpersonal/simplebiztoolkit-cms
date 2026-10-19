import Link from "next/link";
import { links } from "@/config/links";
import { site } from "@/config/site";
import { getPublicVisibleStats } from "@/lib/publicStats";
import { getStarSellerLabel } from "@/lib/stats";
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

export default async function SiteFooter({
  menuNavItems = [],
  navOrderIds = [],
}: Props) {
  const year = new Date().getFullYear();
  const stats = await getPublicVisibleStats();

  const trustItems: string[] = [];
  if (stats.rating) trustItems.push(`${stats.rating} average rating`);
  if (stats.reviews) trustItems.push(`${stats.reviews} Etsy reviews`);
  if (stats.sales) trustItems.push(`${stats.sales} sales`);
  const starSellerLabel = getStarSellerLabel(stats["star-seller"]);
  if (starSellerLabel) trustItems.push(starSellerLabel);

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
    getStaticLink("/contact"),
  ].filter((entry): entry is FooterLink => Boolean(entry));
  const companyLinks = [getStaticLink("/about")].filter(
    (entry): entry is FooterLink => Boolean(entry),
  );

  return (
    <footer className="sb-footer">
      {/* Top bar with trust signals */}
      {trustItems.length > 0 ? (
        <div className="sb-footer-trust-bar">
          <div className="container">
            <div className="sb-footer-trust-inner">
              {trustItems.map((item, index) => (
                <div key={item} className="d-inline-flex align-items-center">
                  <span className="sb-footer-trust-item">
                    <span aria-hidden="true">✓</span> {item}
                  </span>
                  {index < trustItems.length - 1 ? (
                    <span
                      className="sb-footer-trust-divider"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

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
                · {site.contactEmail}
              </p>
            </div>

            {/* Shop */}
            <div className="sb-footer-col">
              <h2 className="sb-footer-heading">Shop</h2>
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
              <h2 className="sb-footer-heading">Support</h2>
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
              <h2 className="sb-footer-heading">Company</h2>
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
              <h2 className="sb-footer-heading">Explore</h2>
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
