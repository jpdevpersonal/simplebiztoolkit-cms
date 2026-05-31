import type { Metadata } from "next";

import ProfitCalculatorClient from "./ProfitCalculatorClient";
import "./profitCalculator.css";

const PAGE_URL = "https://www.simplebiztoolkit.com/tools/profit-calculator";
const TOOLS_PAGES_URL = "https://www.simplebiztoolkit.com/pages/tools";

export const metadata: Metadata = {
  title: "Free Profit Calculator — Etsy Fee, Pricing & Margin Tool",
  description:
    "Free Profit Calculator to work out Etsy fees, product costs, profit margin, and the selling price you need to charge to make a real profit. No sign-up, runs in your browser.",
  keywords: [
    "etsy profit calculator",
    "etsy pricing calculator",
    "etsy fee calculator",
    "etsy profit margin calculator",
    "how much should i charge on etsy",
    "etsy seller calculator",
    "etsy pricing tool",
    "etsy margin calculator",
    "etsy listing fee",
    "etsy seller profit",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: "Free Profit Calculator for Etsy — Fee & Pricing Tool",
    description:
      "Calculate Etsy fees, product costs, profit margin, and the price you need to charge to make a real profit. Free, private, no sign-up.",
    url: PAGE_URL,
    siteName: "Simple Biz Toolkit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Profit Calculator for Etsy",
    description:
      "Calculate Etsy fees, product costs, profit margin, and the price you need to charge to make a real profit. Free, private, no sign-up.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Profit Calculator for Etsy",
  url: PAGE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Free in-browser Etsy profit calculator that works out Etsy fees, product costs, profit margin and the selling price you need to charge to make a real profit.",
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
    "Calculate profit from a selling price",
    "Find the price for a target profit per sale",
    "Find the price for a target profit margin",
    "Breaks down Etsy transaction, payment, listing and offsite ad fees",
    "Shows profit, margin, markup and break-even sales",
    "Pricing scenario table comparing prices above and below your target",
    "Runs entirely in your browser — no upload",
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
      name: "Profit Calculator for Etsy",
      item: PAGE_URL,
    },
  ],
};

export default function ProfitCalculatorPage() {
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
      <ProfitCalculatorClient />
    </>
  );
}
