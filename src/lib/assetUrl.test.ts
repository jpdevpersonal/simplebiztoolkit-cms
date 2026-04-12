import { describe, expect, it } from "vitest";

import { withAssetVersion } from "./assetUrl";

describe("assetUrl", () => {
  it("adds a version query param to relative asset paths", () => {
    expect(withAssetVersion("/images/hero.webp", "2026-04-12T10:15:00Z")).toBe(
      "/images/hero.webp?v=2026-04-12T10%3A15%3A00Z",
    );
  });

  it("preserves existing query params and replaces prior version values", () => {
    expect(
      withAssetVersion(
        "/images/hero.webp?fit=cover&v=old",
        "2026-04-12T10:15:00Z",
      ),
    ).toBe("/images/hero.webp?fit=cover&v=2026-04-12T10%3A15%3A00Z");
  });

  it("works with absolute URLs", () => {
    expect(
      withAssetVersion(
        "https://cdn.example.com/images/hero.webp",
        "2026-04-12T10:15:00Z",
      ),
    ).toBe(
      "https://cdn.example.com/images/hero.webp?v=2026-04-12T10%3A15%3A00Z",
    );
  });

  it("returns undefined for empty asset input", () => {
    expect(withAssetVersion("", "2026-04-12T10:15:00Z")).toBeUndefined();
    expect(withAssetVersion(undefined, "2026-04-12T10:15:00Z")).toBeUndefined();
  });
});
