import { describe, expect, it } from "vitest";
import {
  formatTemplateCount,
  getTemplateCategoryStats,
} from "./templateCategoryStats";

describe("getTemplateCategoryStats", () => {
  it("handles missing items", () => {
    expect(getTemplateCategoryStats(undefined)).toEqual({
      count: 0,
      fromPrice: null,
      previewImage: null,
    });
  });

  it("returns count, cheapest price and first available image", () => {
    expect(
      getTemplateCategoryStats([
        { image: "", price: "$3.50" },
        { image: "/a.webp", price: "$1.75" },
        { image: "/b.webp", price: "" },
        { image: "/c.webp", price: "£2.00", priceAmount: 2 },
      ]),
    ).toEqual({ count: 4, fromPrice: "$1.75", previewImage: "/a.webp" });
  });

  it("prefers numeric priceAmount when present", () => {
    expect(
      getTemplateCategoryStats([
        { price: "$9.99", priceAmount: 0.99 },
        { price: "$1.50" },
      ]).fromPrice,
    ).toBe("$9.99");
  });
});

describe("formatTemplateCount", () => {
  it("pluralises", () => {
    expect(formatTemplateCount(1)).toBe("1 template");
    expect(formatTemplateCount(7)).toBe("7 templates");
  });
});
