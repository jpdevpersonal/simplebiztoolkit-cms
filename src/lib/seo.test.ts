import { describe, expect, it } from "vitest";
import {
  createBreadcrumbJsonLd,
  createPageMetadata,
  createProductJsonLd,
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
});
