import type { Metadata } from "next";
import Script from "next/script";
import { site } from "@/config/site";

import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/theme.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCta from "@/components/StickyMobileCta";
import JsonLd from "@/components/JsonLd";
import BootstrapClient from "../BootstrapClient";
import ScrollToTop from "../ScrollToTop";
import {
  FOOTER_MENU_LOCATION_KEY,
  PRIMARY_MENU_LOCATION_KEY,
} from "@/lib/menuLocations";
import type { MenuNavItem } from "@/lib/siteMenu";
import { createWebsiteJsonLd } from "@/lib/seo";
import {
  getMenuLayoutOrderIds,
  getMenuItemLandingHref,
  getPublishedMenuItems,
  getPublishedMenuItemContent,
  orderMenuItemsByLayout,
} from "@/lib/menuContent";

export const revalidate = 300;

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
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  // Build dynamic navigation items from published menu items.
  const menuNavItems: MenuNavItem[] = [];
  let navOrderIds: string[] = [];
  let footerOrderIds: string[] = [];
  try {
    const [publishedItemsRaw, layoutOrderIds, footerLayoutOrderIds] =
      await Promise.all([
        getPublishedMenuItems(),
        getMenuLayoutOrderIds(PRIMARY_MENU_LOCATION_KEY),
        getMenuLayoutOrderIds(FOOTER_MENU_LOCATION_KEY),
      ]);

    navOrderIds = layoutOrderIds;
    footerOrderIds = footerLayoutOrderIds;
    const publishedItems = orderMenuItemsByLayout(
      publishedItemsRaw,
      layoutOrderIds,
    );

    for (const item of publishedItems) {
      const content = await getPublishedMenuItemContent(item);
      if (content.totalPages === 0) continue;

      menuNavItems.push({
        id: item.id,
        title: item.title,
        directHref: getMenuItemLandingHref(content),
      });
    }
  } catch (err) {
    // Navigation data not critical – fall back to static items only
    console.error("[Nav] Failed to fetch menu items-tree:", err);
  }

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId ?? "G-3ZQY64S5JJ"}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);} 
          gtag('js', new Date());

          gtag('config', '${gaId ?? "G-3ZQY64S5JJ"}');
        `}
      </Script>

      <BootstrapClient />
      <ScrollToTop />

      <JsonLd json={createWebsiteJsonLd()} />

      <a className="sb-skip-link" href="#content">
        Skip to content
      </a>

      <SiteHeader menuNavItems={menuNavItems} navOrderIds={navOrderIds} />
      <main id="content">{children}</main>
      <SiteFooter menuNavItems={menuNavItems} navOrderIds={footerOrderIds} />
      <StickyMobileCta />
    </>
  );
}
