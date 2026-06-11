import { describe, expect, it } from "vitest";
import {
  createAboutPageJsonLd,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
  createHowToJsonLd,
  createItemListJsonLd,
  createOrganizationJsonLd,
  createPageMetadata,
  createProductJsonLd,
  createWebPageJsonLd,
  createWebsiteJsonLd,
  normalizePublicUrl,
  toAbsoluteUrl,
} from "./seo";

describe("seo", () => {
  it("creates consistent metadata with canonical and social fields", () => {
    const metadata = createPageMetadata({
      title: "Guides",
      description: "Helpful page collection",
      pathname: "/pages/guides",
    });

    expect(metadata.alternates?.canonical).toBe("/pages/guides");
    expect(metadata.openGraph?.url).toBe("/pages/guides");
    expect(metadata.twitter?.card).toBe("summary_large_image");
  });

  it("builds absolute URLs from relative paths", () => {
    expect(toAbsoluteUrl("/pages/guides/payroll")).toBe(
      "https://www.simplebiztoolkit.com/pages/guides/payroll",
    );
    expect(toAbsoluteUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(
      toAbsoluteUrl(
        "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
      ),
    ).toBe("https://www.simplebiztoolkit.com");
  });

  it("normalizes public URLs and rejects local file paths", () => {
    expect(normalizePublicUrl("guides/payroll")).toBe("/guides/payroll");
    expect(normalizePublicUrl("https://example.com/path")).toBe(
      "https://example.com/path",
    );
    expect(normalizePublicUrl("//cdn.example.com/image.webp")).toBe(
      "https://cdn.example.com/image.webp",
    );
    expect(
      normalizePublicUrl(
        "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
      ),
    ).toBeUndefined();
    expect(normalizePublicUrl("file:///tmp/example.pdf")).toBeUndefined();
  });

  it("creates breadcrumb structured data", () => {
    const jsonLd = createBreadcrumbJsonLd([
      { name: "Home", href: "/" },
      { name: "Guides", href: "/pages/guides" },
    ]);

    expect(jsonLd.itemListElement).toHaveLength(2);
  });

  it("creates product structured data with an offer", () => {
    const jsonLd = createProductJsonLd({
      name: "Budget Planner",
      description: "A simple planner",
      href: "/templates/planners/budget-planner",
      price: "$12.00",
      offerUrl: "https://etsy.example/listing/123",
    });

    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.offers).toMatchObject({ price: "12.00" });
  });

  it("falls back to safe metadata values when CMS URLs are invalid", () => {
    const metadata = createPageMetadata({
      title: "Guide",
      pathname: "/guide",
      canonical:
        "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
      image:
        "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
    });

    expect(metadata.alternates?.canonical).toBe("/guide");
    expect(metadata.openGraph?.url).toBe("/guide");
    expect(metadata.openGraph?.images).toEqual([
      { url: "/images/hero-image-desk.webp" },
    ]);
    expect(metadata.twitter?.images).toEqual(["/images/hero-image-desk.webp"]);
  });

  it("preserves valid canonical and image URLs for metadata", () => {
    const metadata = createPageMetadata({
      title: "Guide",
      pathname: "/guide",
      canonical: "https://www.simplebiztoolkit.com/guide",
      image: "//cdn.example.com/guide-cover.webp",
    });

    expect(metadata.alternates?.canonical).toBe(
      "https://www.simplebiztoolkit.com/guide",
    );
    expect(metadata.openGraph?.url).toBe("/guide");
    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.example.com/guide-cover.webp" },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "https://cdn.example.com/guide-cover.webp",
    ]);
  });

  it("omits invalid image URLs from web page structured data", () => {
    const jsonLd = createWebPageJsonLd({
      name: "Guide",
      href: "/guide",
      image:
        "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
    });

    expect(jsonLd.image).toBeUndefined();
  });

  it("emits a WebSite node with SearchAction and publisher", () => {
    const jsonLd = createWebsiteJsonLd();
    expect(jsonLd["@type"]).toBe("WebSite");
    expect(jsonLd.inLanguage).toBe("en-GB");
    expect(jsonLd.potentialAction).toMatchObject({
      "@type": "SearchAction",
    });
    expect(jsonLd.potentialAction.target.urlTemplate).toContain(
      "/templates?q={search_term_string}",
    );
    expect(jsonLd.publisher?.["@type"]).toBe("Organization");
  });

  it("emits an Organization node with aggregateRating and contact", () => {
    const jsonLd = createOrganizationJsonLd();
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.aggregateRating?.ratingValue).toBe("4.8");
    expect(jsonLd.aggregateRating?.reviewCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(jsonLd.sameAs)).toBe(true);
    expect(jsonLd.logo).toBeDefined();
    expect(jsonLd.email).toBeDefined();
  });

  it("emits FAQPage with each Q&A", () => {
    const jsonLd = createFaqJsonLd([
      { question: "What is X?", answer: "Y." },
      { question: "When?", answer: "Now." },
    ]);
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(2);
    expect(jsonLd.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "What is X?",
    });
    expect(jsonLd.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
  });

  it("emits HowTo with numbered steps", () => {
    const jsonLd = createHowToJsonLd({
      name: "Print a template",
      description: "Open and print",
      steps: [
        { name: "Open", text: "Open the PDF" },
        { name: "Size", text: "Choose A4 or US Letter" },
        { name: "Print", text: "Print the page" },
      ],
      totalTimeMinutes: 5,
    });
    expect(jsonLd["@type"]).toBe("HowTo");
    expect(jsonLd.step).toHaveLength(3);
    expect(jsonLd.step[0]["@type"]).toBe("HowToStep");
    expect(jsonLd.totalTime).toBe("PT5M");
  });

  it("emits ItemList with positional list items", () => {
    const jsonLd = createItemListJsonLd({
      name: "Best sellers",
      items: [
        { name: "Invoice", href: "/templates/invoices/a" },
        { name: "Ledger", href: "/templates/accounting-ledger/b" },
      ],
    });
    expect(jsonLd["@type"]).toBe("ItemList");
    expect(jsonLd.itemListElement).toHaveLength(2);
    expect(jsonLd.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
    });
  });

  it("emits Article with publisher logo and speakable spec", () => {
    const jsonLd = createArticleJsonLd({
      headline: "How to invoice clients",
      description: "Guide",
      href: "/pages/guides/how-to-invoice-clients",
      datePublished: "2024-01-01",
      dateModified: "2024-02-01",
    });
    expect(jsonLd["@type"]).toBe("Article");
    expect(jsonLd.publisher?.["@type"]).toBe("Organization");
    expect(jsonLd.publisher?.logo?.["@type"]).toBe("ImageObject");
    expect(jsonLd.speakable?.["@type"]).toBe("SpeakableSpecification");
  });

  it("emits AboutPage with mainEntity", () => {
    const jsonLd = createAboutPageJsonLd({
      name: "About Simple Biz Toolkit",
      description: "Our story",
      href: "/about",
    });
    expect(jsonLd["@type"]).toBe("AboutPage");
    expect(jsonLd.mainEntity?.["@type"]).toBe("Organization");
  });

  it("creates product structured data with sku, category and additionalProperty", () => {
    const jsonLd = createProductJsonLd({
      name: "Budget Planner",
      description: "A simple planner",
      href: "/templates/planners/budget-planner",
      price: "$12.00",
      offerUrl: "https://etsy.example/listing/123",
      sku: "SBT-BP-001",
      category: "Planners",
      attributes: [
        { name: "Format", value: "PDF" },
        { name: "Paper sizes", value: "A4, US Letter" },
      ],
    });

    expect(jsonLd.sku).toBe("SBT-BP-001");
    expect(jsonLd.category).toBe("Planners");
    expect(jsonLd.brand?.["@type"]).toBe("Brand");
    expect(jsonLd.additionalProperty).toHaveLength(2);
    expect(jsonLd.additionalProperty?.[0]).toMatchObject({
      "@type": "PropertyValue",
      name: "Format",
    });
    expect(
      (jsonLd.offers as { seller?: { "@type"?: string } }).seller?.["@type"],
    ).toBe("Organization");
  });

  it("returns undefined for whitespace-only public URL inputs", () => {
    expect(normalizePublicUrl("   ")).toBeUndefined();
    expect(normalizePublicUrl("")).toBeUndefined();
    expect(normalizePublicUrl(null)).toBeUndefined();
  });

  it("returns undefined when an absolute URL is malformed", () => {
    // Brackets in the host make this an invalid URL
    expect(normalizePublicUrl("https://[bad host]/path")).toBeUndefined();
  });

  it("returns undefined when a protocol-relative URL is malformed", () => {
    expect(normalizePublicUrl("//[bad host]/path")).toBeUndefined();
  });
});
