import type { Metadata } from "next";

import CsvProfitCalculatorClient from "./CsvProfitCalculatorClient";
import { CSV_CALCULATOR_FAQS } from "./faqContent";
import "./csvProfitCalculator.css";

const PAGE_URL = "https://www.simplebiztoolkit.com/tools/csv-profit-calculator";
const TOOLS_PAGES_URL = "https://www.simplebiztoolkit.com/pages/tools";

export const metadata: Metadata = {
  title:
    "Free Etsy CSV Profit Calculator — Monthly Profit Report for Etsy Sellers",
  description:
    "Free Etsy profit calculator. Upload your Etsy payment CSV and get a clean month-by-month report of revenue, fees, refunds and real profit. No sign-up. Runs in your browser.",
  keywords: [
    "etsy csv profit calculator",
    "etsy profit calculator",
    "etsy fee calculator",
    "etsy seller bookkeeping",
    "etsy monthly profit report",
    "etsy payment csv",
    "etsy taxes",
    "online seller profit tracker",
    "etsy accounting tool",
    "etsy shop profit",
  ],
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title:
      "Free Etsy CSV Profit Calculator — Monthly Profit Report for Etsy Sellers",
    description:
      "Drop your Etsy payment CSV in and get a clean monthly profit report. Revenue, fees, refunds, real profit. Free, private, no sign-up.",
    url: PAGE_URL,
    siteName: "Simple Biz Toolkit",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Etsy CSV Profit Calculator for Etsy Sellers",
    description:
      "Drop your Etsy payment CSV in and get a clean monthly profit report. Free, private, no sign-up.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const softwareApplicationLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Etsy CSV Profit Calculator",
  url: PAGE_URL,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web Browser",
  description:
    "Free in-browser tool for Etsy sellers that turns a payment account CSV export into a clean monthly profit report covering revenue, fees, refunds and net received.",
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
    "Reads Etsy payment account CSV exports",
    "Groups transactions by month",
    "Separates revenue, Etsy fees, refunds and adjustments",
    "Lets you add packaging, shipping, ads and other costs",
    "Exports to Excel (XLSX) or CSV",
    "Runs entirely in your browser — no upload",
  ],
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: CSV_CALCULATOR_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
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
      name: "Etsy CSV Profit Calculator",
      item: PAGE_URL,
    },
  ],
};

export default function CsvProfitCalculatorPage() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <CsvProfitCalculatorClient />
    </>
  );
}
