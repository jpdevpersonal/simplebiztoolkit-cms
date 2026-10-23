import { describe, expect, it } from "vitest";
import {
  isSitemapEligiblePath,
  toSitemapLastModified,
} from "./sitemap";

describe("toSitemapLastModified", () => {
  it("returns a Date for ISO date-only strings", () => {
    const lastModified = toSitemapLastModified("2026-04-10");

    expect(lastModified).toBeInstanceOf(Date);
    expect(lastModified?.toISOString()).toBe("2026-04-10T00:00:00.000Z");
  });

  it("returns a Date for ISO timestamp strings", () => {
    const lastModified = toSitemapLastModified("2026-04-10T21:35:35.243Z");

    expect(lastModified).toBeInstanceOf(Date);
    expect(lastModified?.toISOString()).toBe("2026-04-10T21:35:35.243Z");
  });

  it("prefers the first valid candidate", () => {
    const lastModified = toSitemapLastModified(
      "2026-04-09",
      "2026-04-10T21:35:35.243Z",
    );

    expect(lastModified?.toISOString()).toBe("2026-04-09T00:00:00.000Z");
  });

  it("falls back when dateModified is malformed", () => {
    const lastModified = toSitemapLastModified("Invalid Date", "2026-04-10");

    expect(lastModified?.toISOString()).toBe("2026-04-10T00:00:00.000Z");
  });

  it("ignores unsupported date formats", () => {
    const lastModified = toSitemapLastModified(
      "04/10/2026",
      "2026-04-10 21:35:35",
      "   ",
    );

    expect(lastModified).toBeUndefined();
  });

  it("rejects datetime strings without a timezone", () => {
    const lastModified = toSitemapLastModified(
      "2026-04-07T14:56:18.5877076",
      undefined,
    );

    expect(lastModified).toBeUndefined();
  });

  it("falls back when the first datetime is missing a timezone", () => {
    const lastModified = toSitemapLastModified(
      "2026-04-07T14:56:18.5877076",
      "2026-04-10T21:35:35.243Z",
    );

    expect(lastModified?.toISOString()).toBe("2026-04-10T21:35:35.243Z");
  });

  it("ignores invalid Date instances", () => {
    const lastModified = toSitemapLastModified(
      new Date("not-a-date"),
      undefined,
    );

    expect(lastModified).toBeUndefined();
  });

  it("omits future modification dates", () => {
    expect(toSitemapLastModified("2999-01-01")).toBeUndefined();
  });

  it.each([
    ["/guides/payroll", true],
    ["/tools/profit-calculator", true],
    ["/free", false],
    ["/products/category/item", false],
    ["/preview/templates/123", false],
    ["/admin/login", false],
    ["/guides/payroll?source=nav", false],
    ["/guides/payroll#top", false],
  ])("determines sitemap eligibility for %s", (pathname, expected) => {
    expect(isSitemapEligiblePath(pathname)).toBe(expected);
  });
});
