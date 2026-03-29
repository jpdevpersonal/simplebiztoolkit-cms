import { describe, expect, it } from "vitest";
import {
  hasSameIdOrder,
  normalizeOrderedMenuItemIds,
  orderEntitiesByIds,
} from "./menuLayout";

describe("menuLayout", () => {
  it("normalizes ordered ids from arrays and removes blanks/duplicates", () => {
    expect(
      normalizeOrderedMenuItemIds(["menu-2", "", "menu-1", "menu-2"]),
    ).toEqual(["menu-2", "menu-1"]);
  });

  it("normalizes ordered ids from JSON strings", () => {
    expect(normalizeOrderedMenuItemIds('["menu-3", "menu-1"]')).toEqual([
      "menu-3",
      "menu-1",
    ]);
  });

  it("returns empty list for invalid JSON input", () => {
    expect(normalizeOrderedMenuItemIds("not-json")).toEqual([]);
  });

  it("orders entities by configured ids and appends uncaptured ids", () => {
    const items = [
      { id: "menu-1", title: "One" },
      { id: "menu-2", title: "Two" },
      { id: "menu-3", title: "Three" },
    ];

    const ordered = orderEntitiesByIds(items, ["menu-3", "menu-1"]);

    expect(ordered.map((item) => item.id)).toEqual([
      "menu-3",
      "menu-1",
      "menu-2",
    ]);
  });

  it("compares id order equality", () => {
    const left = [{ id: "a" }, { id: "b" }];
    const right = [{ id: "a" }, { id: "b" }];
    const different = [{ id: "b" }, { id: "a" }];

    expect(hasSameIdOrder(left, right)).toBe(true);
    expect(hasSameIdOrder(left, different)).toBe(false);
  });
});
