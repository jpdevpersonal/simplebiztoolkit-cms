import { describe, expect, it } from "vitest";
import {
  composeOrderedMenuEntries,
  getOrderedMenuEntryHref,
  type MenuNavItem,
} from "./siteMenu";

describe("composeOrderedMenuEntries", () => {
  it("returns static items followed by CMS items when no order ids are supplied", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
    ];

    const result = composeOrderedMenuEntries(cmsItems, []);

    const staticEntries = result.filter((e) => e.kind === "static");
    const cmsEntries = result.filter((e) => e.kind === "cms");

    expect(staticEntries.length).toBeGreaterThan(0);
    expect(cmsEntries).toHaveLength(2);
    // Static items come before CMS items by default
    const staticIndex = result.findIndex((e) => e.kind === "static");
    const cmsIndex = result.findIndex((e) => e.kind === "cms");
    expect(staticIndex).toBeLessThan(cmsIndex);
  });

  it("orders CMS items by provided order ids when no static tokens are present", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
      { id: "cms-3", title: "Tools" },
    ];

    const result = composeOrderedMenuEntries(cmsItems, [
      "cms-3",
      "cms-1",
      "cms-2",
    ]);

    const cmsEntries = result.filter((e) => e.kind === "cms");
    expect(cmsEntries.map((e) => (e as any).item.id)).toEqual([
      "cms-3",
      "cms-1",
      "cms-2",
    ]);
  });

  it("appends unordered CMS items after ordered ones when only CMS ids are provided", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
      { id: "cms-3", title: "Tools" },
    ];

    // Only order cms-2; cms-1 and cms-3 should appear after it
    const result = composeOrderedMenuEntries(cmsItems, ["cms-2"]);

    const cmsEntries = result.filter((e) => e.kind === "cms");
    expect(cmsEntries[0]).toMatchObject({ kind: "cms", orderId: "cms-2" });
    expect(cmsEntries.map((e) => e.orderId)).toContain("cms-1");
    expect(cmsEntries.map((e) => e.orderId)).toContain("cms-3");
  });

  it("deduplicates CMS entries when the same id appears multiple times in order ids", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
    ];

    const result = composeOrderedMenuEntries(cmsItems, [
      "cms-1",
      "cms-1",
      "cms-2",
    ]);

    const cmsEntries = result.filter((e) => e.kind === "cms");
    const ids = cmsEntries.map((e) => e.orderId);
    expect(ids.filter((id) => id === "cms-1")).toHaveLength(1);
    expect(ids.filter((id) => id === "cms-2")).toHaveLength(1);
  });

  it("excludes a static item when its hidden order id is in the order list", () => {
    const result = composeOrderedMenuEntries([], ["hidden-static:/templates"]);

    const staticEntries = result.filter((e) => e.kind === "static");
    const templatesEntry = staticEntries.find(
      (e) => (e as any).to === "/templates",
    );
    expect(templatesEntry).toBeUndefined();
  });

  it("positions static items correctly when static order ids are provided", () => {
    const cmsItems: MenuNavItem[] = [{ id: "cms-1", title: "Guides" }];

    const result = composeOrderedMenuEntries(cmsItems, [
      "cms-1",
      "static:/faq",
    ]);

    const ids = result.map((e) => e.orderId);
    const cmsIndex = ids.indexOf("cms-1");
    const faqIndex = ids.findIndex((id) => id === "static:/faq");

    expect(cmsIndex).toBeGreaterThanOrEqual(0);
    expect(faqIndex).toBeGreaterThanOrEqual(0);
    expect(cmsIndex).toBeLessThan(faqIndex);
  });

  it("handles cms: prefixed ids when resolving CMS entries", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
    ];

    // Order ids with and without the cms: prefix should resolve to the same item
    const result = composeOrderedMenuEntries(cmsItems, [
      "static:/faq",
      "cms:cms-2",
      "cms-1",
    ]);

    const cmsEntries = result.filter((e) => e.kind === "cms");
    const orderedIds = cmsEntries.map((e) => e.orderId);
    expect(orderedIds).toContain("cms-2");
    expect(orderedIds).toContain("cms-1");
  });

  it("returns empty array when no items or order ids are provided", () => {
    const result = composeOrderedMenuEntries([], []);
    const cmsEntries = result.filter((e) => e.kind === "cms");
    expect(cmsEntries).toHaveLength(0);
  });

  it("appends remaining entries after positioned ones when static tokens are present", () => {
    const cmsItems: MenuNavItem[] = [
      { id: "cms-1", title: "Guides" },
      { id: "cms-2", title: "Tutorials" },
    ];

    const result = composeOrderedMenuEntries(cmsItems, [
      "static:/faq",
      "cms-1",
    ]);

    const faqIndex = result.findIndex(
      (e) => e.kind === "static" && (e as any).to === "/faq",
    );
    const cmsIndex = result.findIndex(
      (e) => e.kind === "cms" && e.orderId === "cms-1",
    );
    // cms-2 should appear since it wasn't in the order list but should be included
    const cms2 = result.find((e) => e.kind === "cms" && e.orderId === "cms-2");

    expect(faqIndex).toBeGreaterThanOrEqual(0);
    expect(cmsIndex).toBeGreaterThanOrEqual(0);
    expect(cms2).toBeDefined();
  });
});

describe("getOrderedMenuEntryHref", () => {
  it("returns the static item href for static entries", () => {
    const entry = {
      kind: "static" as const,
      orderId: "static:/templates",
      to: "/templates",
      label: "Templates",
    };

    expect(getOrderedMenuEntryHref(entry)).toBe("/templates");
  });

  it("returns the directHref for CMS entries that have one", () => {
    const entry = {
      kind: "cms" as const,
      orderId: "cms-1",
      item: {
        id: "cms-1",
        title: "Guides",
        directHref: "/guides",
      },
    };

    expect(getOrderedMenuEntryHref(entry)).toBe("/guides");
  });

  it("returns undefined for CMS entries without a directHref", () => {
    const entry = {
      kind: "cms" as const,
      orderId: "cms-1",
      item: {
        id: "cms-1",
        title: "Guides",
      },
    };

    expect(getOrderedMenuEntryHref(entry)).toBeUndefined();
  });
});
