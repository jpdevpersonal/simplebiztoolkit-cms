import { describe, expect, it } from "vitest";
import {
  createAboutPageJsonLd,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  createFaqJsonLd,
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
    expect((metadata.twitter as any)?.card).toBe("summary_large_image");
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
    const anyJson = jsonLd as any;

    expect(anyJson.itemListElement).toHaveLength(2);
  });

  it("creates product structured data with an offer", () => {
    const jsonLd = createProductJsonLd({
      name: "Budget Planner",
      description: "A simple planner",
      href: "/templates/planners/budget-planner",
      price: "$12.00",
      offerUrl: "https://etsy.example/listing/123",
    });
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("Product");
    expect(anyJson.offers).toMatchObject({ price: "12.00" });
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
    const anyJson = jsonLd as any;

    expect(anyJson.image).toBeUndefined();
  });

  it("emits a WebSite node with SearchAction and publisher", () => {
    const jsonLd = createWebsiteJsonLd();
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("WebSite");
    expect(anyJson.inLanguage).toBe("en-GB");
    expect(anyJson.potentialAction).toMatchObject({
      "@type": "SearchAction",
    });
    expect(anyJson.potentialAction.target.urlTemplate).toContain(
      "/templates?q={search_term_string}",
    );
    expect(anyJson.publisher?.["@type"]).toBe("Organization");
  });

  it("emits an Organization node with aggregateRating and contact", () => {
    const jsonLd = createOrganizationJsonLd();
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("Organization");
    expect(anyJson.aggregateRating?.ratingValue).toBe("4.8");
    expect(anyJson.aggregateRating?.reviewCount).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(anyJson.sameAs)).toBe(true);
    expect(anyJson.logo).toBeDefined();
    expect(anyJson.email).toBeDefined();
  });

  it("emits FAQPage with each Q&A", () => {
    const jsonLd = createFaqJsonLd([
      { question: "What is X?", answer: "Y." },
      { question: "When?", answer: "Now." },
    ]);
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("FAQPage");
    expect(anyJson.mainEntity).toHaveLength(2);
    expect(anyJson.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "What is X?",
    });
    expect(anyJson.mainEntity[0].acceptedAnswer["@type"]).toBe("Answer");
  });

  it("emits ItemList with positional list items", () => {
    const jsonLd = createItemListJsonLd({
      name: "Best sellers",
      items: [
        { name: "Invoice", href: "/templates/invoices/a" },
        { name: "Ledger", href: "/templates/accounting-ledger/b" },
      ],
    });
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("ItemList");
    expect(anyJson.itemListElement).toHaveLength(2);
    expect(anyJson.itemListElement[0]).toMatchObject({
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
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("Article");
    expect(anyJson.publisher?.["@type"]).toBe("Organization");
    expect(anyJson.publisher?.logo?.["@type"]).toBe("ImageObject");
    expect(anyJson.speakable?.["@type"]).toBe("SpeakableSpecification");
  });

  it("emits AboutPage with mainEntity", () => {
    const jsonLd = createAboutPageJsonLd({
      name: "About Simple Biz Toolkit",
      description: "Our story",
      href: "/about",
    });
    const anyJson = jsonLd as any;

    expect(anyJson["@type"]).toBe("AboutPage");
    expect(anyJson.mainEntity?.["@type"]).toBe("Organization");
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
    const anyJson = jsonLd as any;

    expect(anyJson.sku).toBe("SBT-BP-001");
    expect(anyJson.category).toBe("Planners");
    expect(anyJson.brand?.["@type"]).toBe("Brand");
    expect(anyJson.additionalProperty).toHaveLength(2);
    expect(anyJson.additionalProperty?.[0]).toMatchObject({
      "@type": "PropertyValue",
      name: "Format",
    });
    expect(
      (anyJson.offers as { seller?: { "@type"?: string } }).seller?.["@type"],
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
