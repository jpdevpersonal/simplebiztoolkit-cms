import type { Tool } from "../types/tool";

export const featuredTools: Tool[] = [
  {
    slug: "profit-calculator",
    title: "Profit Calculator for Etsy",
    tagline:
      "Work out Etsy fees, costs and the exact price you need to charge to make a real profit.",
    bullets: [
      "Breaks down every Etsy fee",
      "Finds your ideal selling price",
      "Free \u2014 runs in your browser",
    ],
    image: "/images/tools/featured/profit-calculator.webp",
    href: "/tools/profit-calculator",
  },
  {
    slug: "estimate-quote-generator",
    title: "Estimate & Quote PDF Generator",
    tagline:
      "Build a professional estimate or quote and download it as a polished PDF in seconds.",
    bullets: [
      "Custom logo & branding",
      "Multi-line itemized totals",
      "Instant print-ready PDF",
    ],
    image: "/images/tools/featured/estimate-quote-generator.webp",
    href: "/tools/estimate-quote-generator",
  },
  {
    slug: "csv-profit-calculator",
    title: "Etsy CSV Profit Calculator",
    tagline:
      "Turn your Etsy payment CSV into a clear, month-by-month profit report.",
    bullets: [
      "Upload up to 15 CSV files",
      "Splits out revenue, fees & refunds",
      "Export to Excel or CSV",
    ],
    image: "/images/tools/featured/csv-profit-calculator.webp",
    href: "/tools/csv-profit-calculator",
  },
];
