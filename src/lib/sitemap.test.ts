import { describe, expect, it } from "vitest";
import { toSitemapLastModified } from "./sitemap";

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

  it("ignores invalid Date instances", () => {
    const lastModified = toSitemapLastModified(
      new Date("not-a-date"),
      undefined,
    );

    expect(lastModified).toBeUndefined();
  });
});
