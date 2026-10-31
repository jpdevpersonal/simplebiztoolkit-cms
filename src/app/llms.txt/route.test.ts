import { describe, expect, it, vi } from "vitest";
import { site } from "@/config/site";
import { GET as getShortReference } from "./route";
import { GET as getFullReference } from "../llms-full.txt/route";

vi.mock("@/lib/api", () => ({
  getApiService: () => ({
    getProductCategories: vi.fn().mockResolvedValue({ data: [] }),
  }),
}));

vi.mock("@/lib/menuContent", () => ({
  getPublishedMenuItems: vi.fn().mockResolvedValue([]),
  getPublishedMenuItemContent: vi.fn(),
  getMenuItemLandingHref: vi.fn(),
}));

describe.each([
  ["llms.txt", getShortReference],
  ["llms-full.txt", getFullReference],
] as const)("%s tool listings", (_name, getReference) => {
  it("lists all three public tools with descriptions and absolute links", async () => {
    const response = await getReference();
    const text = await response.text();

    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(text).toContain("## Tools");
    for (const [title, path] of [
      ["Profit Calculator for Etsy", "/tools/profit-calculator"],
      ["Estimate & Quote PDF Generator", "/tools/estimate-quote-generator"],
      ["Etsy CSV Profit Calculator", "/tools/csv-profit-calculator"],
    ]) {
      expect(text).toContain(`- [${title}](${site.url}${path}): `);
      expect(text.split(`${site.url}${path})`)).toHaveLength(2);
    }
  });
});
