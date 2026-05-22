import type { Metadata } from "next";

import EstimateQuoteGeneratorClient from "./EstimateQuoteGeneratorClient";
import "./estimateQuoteGenerator.css";

const PAGE_URL =
  "https://www.simplebiztoolkit.com/tools/estimate-quote-generator";
const TOOLS_PAGES_URL = "https://www.simplebiztoolkit.com/pages/tools";

export const metadata: Metadata = {
  title: "Free Estimate & Quote PDF Generator — Simple Biz Toolkit",
  description:
    "Create a professional estimate or quote and download it as a PDF in seconds. Free, no sign-up, runs entirely in your browser — your data never leaves your device.",
  keywords: [
    "free estimate generator",
    "free quote generator",
    "quote pdf generator",
    "estimate pdf generator",
    "small business quote tool",
    "freelancer estimate template",
    "trades quote generator",
    "invoice alternative",
    "browser pdf generator",
    "private quote tool",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: "Free Estimate & Quote PDF Generator — Simple Biz Toolkit",
    description:
      "Build a professional estimate or quote and download it as a PDF. Free, private, no sign-up.",
    url: PAGE_URL,
    siteName: "Simple Biz Toolkit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Estimate & Quote PDF Generator",
    description:
      "Build a professional estimate or quote and download it as a PDF. Free, private, no sign-up.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Estimate & Quote PDF Generator",
  url: PAGE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Free in-browser tool that lets small businesses, freelancers and tradespeople generate a professional estimate or quote and save it as a PDF — without uploading any data.",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  publisher: {
    "@type": "Organization",
    name: "Simple Biz Toolkit",
    url: "https://www.simplebiztoolkit.com",
  },
  featureList: [
    "Create estimates or quotes from a single form",
    "Live, on-page document preview",
    "Custom logo, currency, tax and discount support",
    "Multi-line item support with per-line totals",
    "Downloads a print-ready PDF",
    "Runs entirely in the browser — no upload",
  ],
};

const breadcrumbLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.simplebiztoolkit.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Tools",
      item: TOOLS_PAGES_URL,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Estimate & Quote PDF Generator",
      item: PAGE_URL,
    },
  ],
};

export default function EstimateQuoteGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <EstimateQuoteGeneratorClient />
    </>
  );
}
