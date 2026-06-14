import type { Metadata } from "next";
import { site } from "@/config/site";

import "@/styles/bootstrap-public.scss";
import "@/styles/theme.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCta from "@/components/StickyMobileCta";
import JsonLd from "@/components/JsonLd";
import DeferredGoogleAnalytics from "../DeferredGoogleAnalytics";
import GoogleAnalyticsPageTracker from "../GoogleAnalyticsPageTracker";
import ScrollToTop from "../ScrollToTop";
import {
  FOOTER_MENU_LOCATION_KEY,
  PRIMARY_MENU_LOCATION_KEY,
} from "@/lib/menuLocations";
import type { MenuNavItem } from "@/lib/siteMenu";
import { createOrganizationJsonLd, createWebsiteJsonLd } from "@/lib/seo";
import {
  getMenuLayoutOrderIds,
  getMenuItemLandingHref,
  getPublishedMenuItems,
  getPublishedMenuItemContent,
  orderMenuItemsByLayout,
} from "@/lib/menuContent";

const NAV_FETCH_TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

const DEFAULT_GA_MEASUREMENT_ID = "G-3ZQY64S5JJ";
const PLACEHOLDER_GA_MEASUREMENT_IDS = new Set(["G-XXXXXXXX"]);

// Default delay used when injecting gtag. Keep in sync with
// src/app/DeferredGoogleAnalytics.tsx default constant.
// Default to 1000ms unless overridden via env.
const DEFAULT_GTAG_DELAY_MS = 1000;

function resolveGtagDelayMs(configuredDelay: string | undefined) {
  const trimmed = configuredDelay?.trim();

  if (!trimmed) return DEFAULT_GTAG_DELAY_MS;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
    return DEFAULT_GTAG_DELAY_MS;
  }

  return Math.trunc(parsed);
}

function resolveGaMeasurementId(configuredId: string | undefined) {
  const trimmedId = configuredId?.trim();

  if (!trimmedId || PLACEHOLDER_GA_MEASUREMENT_IDS.has(trimmedId)) {
    return DEFAULT_GA_MEASUREMENT_ID;
  }

  return trimmedId;
}

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
  const gaMeasurementId = resolveGaMeasurementId(process.env.NEXT_PUBLIC_GA_ID);
  const gaDelayMs = resolveGtagDelayMs(process.env.NEXT_PUBLIC_GTAG_DELAY_MS);

  // Build dynamic navigation items from published menu items.
  const menuNavItems: MenuNavItem[] = [];
  let navOrderIds: string[] = [];
  let footerOrderIds: string[] = [];
  try {
    const [publishedItemsRaw, layoutOrderIds, footerLayoutOrderIds] =
      await withTimeout(
        Promise.all([
          getPublishedMenuItems(),
          getMenuLayoutOrderIds(PRIMARY_MENU_LOCATION_KEY),
          getMenuLayoutOrderIds(FOOTER_MENU_LOCATION_KEY),
        ]),
        NAV_FETCH_TIMEOUT_MS,
      );

    const publishedItems = orderMenuItemsByLayout(
      publishedItemsRaw,
      layoutOrderIds,
    );

    const menuContents = await withTimeout(
      Promise.all(
        publishedItems.map((item) =>
          getPublishedMenuItemContent(item).then((content) => ({
            item,
            content,
          })),
        ),
      ),
      NAV_FETCH_TIMEOUT_MS,
    );

    // Only commit the ordering IDs once both fetches succeed so that a
    // partial failure (layout order OK but content fetch timed out) does not
    // leave navOrderIds set to a value that hides static items while
    // menuNavItems stays empty – which previously caused the nav to show
    // only Templates / Reviews / FAQ instead of the full set.
    navOrderIds = layoutOrderIds;
    footerOrderIds = footerLayoutOrderIds;

    for (const { item, content } of menuContents) {
      if (content.totalPages === 0) continue;

      menuNavItems.push({
        id: item.id,
        title: item.title,
        directHref: getMenuItemLandingHref(content),
      });
    }
  } catch (err) {
    // Navigation data not critical – fall back to static items only
    console.warn("[Nav] Falling back to static nav items:", err);
  }

  return (
    <>
      <DeferredGoogleAnalytics
        measurementId={gaMeasurementId}
        delayMs={gaDelayMs}
      />
      <GoogleAnalyticsPageTracker measurementId={gaMeasurementId} />
      <ScrollToTop />

      <JsonLd json={createWebsiteJsonLd()} />
      <JsonLd json={createOrganizationJsonLd()} />

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
