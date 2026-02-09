import type { Metadata } from "next";
import { site } from "@/config/site";

import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/theme.css";

import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StickyMobileCta from "@/components/StickyMobileCta";
import JsonLd from "@/components/JsonLd";
import BootstrapClient from "./BootstrapClient";
import Script from "next/script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID ?? "G-3ZQY64S5JJ";
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
  };

  return (
    <html lang="en">
      <head>
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', '${gaId}');`}
        </Script>
      </head>
      <body>
        <BootstrapClient />

        <JsonLd json={websiteJsonLd} />

        <a className="sb-skip-link" href="#content">
          Skip to content
        </a>

        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
        <StickyMobileCta />
      </body>
    </html>
  );
}
