export const site = {
  name: "Simple Biz Toolkit",
  url: "https://www.simplebiztoolkit.com",
  description:
    "Printable templates and toolkits for small business owners, online sellers, freelancers and landlords. Invoices, time sheets, ledgers, rent trackers and planners — instant PDF downloads via Etsy.",
  locale: "en_GB",
  contactEmail: "simplebiztoolkit@gmail.com",
  defaultOgImage: "/images/hero-image-desk.webp",
  logoPath: "/images/simple-biz-toolkit-logo.png",
  /**
   * Public-facing trust figures sourced from the Etsy shop. Used in
   * Organization JSON-LD and visible site copy so that values stay in sync.
   */
  trust: {
    ratingValue: 5.0,
    reviewCount: 3700,
    salesCount: 3500,
    etsyShop: "simplebiztoolkit",
  },
  /** Social and external profile URLs used by JSON-LD `sameAs`. */
  socialUrls: ["https://www.etsy.com/shop/simplebiztoolkit"],
} as const;
