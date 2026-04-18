import { describe, expect, it } from "vitest";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createProductJsonLd,
  createWebPageJsonLd,
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
});
