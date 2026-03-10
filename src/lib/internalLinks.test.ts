import { describe, expect, it } from "vitest";
import {
  buildRelatedLinks,
  getArticleHref,
  getMenuCategoryHref,
  paginateItems,
} from "./internalLinks";

describe("internalLinks", () => {
  it("builds stable href helpers", () => {
    expect(getArticleHref("cashflow-tips")).toBe("/blog/cashflow-tips");
    expect(getMenuCategoryHref("Business Guides", "Pricing Strategy")).toBe(
      "/pages/business-guides/pricing-strategy",
    );
  });

  it("selects related links by category and shared terms", () => {
    const links = buildRelatedLinks({
      current: {
        slug: "cashflow-checklist",
        title: "Cash Flow Checklist",
        description: "Simple cash flow system for small business",
        category: "finance",
      },
      candidates: [
        {
          slug: "pricing-guide",
          title: "Pricing Guide",
          description: "Improve margins and cash flow",
          category: "finance",
        },
        {
          slug: "etsy-tags",
          title: "Etsy Tags",
          description: "Keyword help for listings",
          category: "marketing",
        },
      ],
      kind: "article",
      getHref: (candidate) => getArticleHref(candidate.slug),
    });

    expect(links).toHaveLength(1);
    expect(links[0]?.href).toBe("/blog/pricing-guide");
  });

  it("paginates content collections", () => {
    const result = paginateItems([1, 2, 3, 4, 5], 2, 2);

    expect(result.items).toEqual([3, 4]);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
  });
});
