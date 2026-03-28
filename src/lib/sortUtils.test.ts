import { describe, expect, it } from "vitest";

import { compareSortValues, parseCurrencyValue } from "./sortUtils";

describe("sortUtils", () => {
  it("sorts ascending and descending values", () => {
    expect(compareSortValues(1, 2, "asc")).toBe(-1);
    expect(compareSortValues(1, 2, "desc")).toBe(1);
    expect(compareSortValues(3, 2, "asc")).toBe(1);
    expect(compareSortValues(3, 2, "desc")).toBe(-1);
    expect(compareSortValues("same", "same", "asc")).toBe(0);
  });

  it("parses currency strings and falls back to zero", () => {
    expect(parseCurrencyValue("$12.50")).toBe(12.5);
    expect(parseCurrencyValue(undefined)).toBe(0);
    expect(parseCurrencyValue("no digits")).toBe(0);
  });
});
