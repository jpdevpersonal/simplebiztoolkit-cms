import type { Metadata } from "next";
import { site } from "@/config/site";

import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/theme.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCta from "@/components/StickyMobileCta";
import JsonLd from "@/components/JsonLd";
import BootstrapClient from "../BootstrapClient";
import ScrollToTop from "../ScrollToTop";
import { apiService } from "@/lib/api";
import { slugify } from "@/lib/slugify";
import type { MenuNavItem } from "@/components/SiteNavigation";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  applicationName: site.name,
  title: {
    default: `${site.name} | Essential Templates & Tools for Small Business Owners`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [
    "small business templates",
    "printable business forms",
    "Etsy business templates",
    "accounting ledger templates",
    "invoice templates",
    "business trackers",
  ],
  creator: site.name,
  publisher: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    url: site.url,
    locale: site.locale,
    title: `${site.name} | Essential Templates & Tools for Small Business Owners`,
    description: site.description,
    images: [
      {
        url: "/images/hero-image-desk.webp",
        width: 1200,
        height: 630,
        alt: "Simple Biz Toolkit templates preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | Essential Templates & Tools for Small Business Owners`,
    description: site.description,
    images: ["/images/hero-image-desk.webp"],
  },
  icons: {
    icon: [
      { url: "/images/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png" }],
  },
};

export default async function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Build dynamic navigation items from published menu items
  const menuNavItems: MenuNavItem[] = [];
  try {
    // Prefer the dedicated tree endpoint; fall back to GetAll if not yet deployed.
    let menuRes = await apiService.getPublishedMenuItems();
    if (menuRes.statusCode === 404) {
      console.warn(
        "[Nav] items-tree endpoint not found, falling back to GetAll",
      );
      menuRes = await apiService.getMenuItems();
    }

    if (menuRes.error) {
      console.error(
        `[Nav] menu API error (${menuRes.statusCode}):`,
        menuRes.error,
      );
    }

    const allItems = menuRes.data ?? [];
    // Filter items by published status client-side (items-tree returns all)
    const publishedItems = allItems.filter((i) => i.status === "published");

    for (const item of publishedItems) {
      const directPages = (item.pages ?? []).filter(
        (p) => p.status === "published",
      );
      const publishedCategories = (item.categories ?? [])
        .filter((cat) => cat.status === "published")
        .map((cat) => ({
          ...cat,
          pages: (cat.pages ?? []).filter((p) => p.status === "published"),
        }))
        .filter((cat) => cat.pages.length > 0);

      const hasContent =
        directPages.length > 0 || publishedCategories.length > 0;
      if (!hasContent) continue;

      if (publishedCategories.length === 0 && directPages.length > 0) {
        // No categories – simple link to the first direct page
        const firstPage = directPages[0];
        menuNavItems.push({
          id: item.id,
          title: item.title,
          directHref:
            directPages.length === 1
              ? `/${firstPage.slug}`
              : `/pages/${slugify(item.title)}`,
        });
      } else {
        // Has categories – link directly to the category listing page
        menuNavItems.push({
          id: item.id,
          title: item.title,
          directHref: `/pages/${slugify(item.title)}`,
        });
      }
    }
  } catch (err) {
    // Navigation data not critical – fall back to static items only
    console.error("[Nav] Failed to fetch menu items-tree:", err);
  }

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
  };

  return (
    <>
      <BootstrapClient />
      <ScrollToTop />

      <JsonLd json={websiteJsonLd} />

      <a className="sb-skip-link" href="#content">
        Skip to content
      </a>

      <SiteHeader menuNavItems={menuNavItems} />
      <main id="content">{children}</main>
      <SiteFooter />
      <StickyMobileCta />
    </>
  );
}
