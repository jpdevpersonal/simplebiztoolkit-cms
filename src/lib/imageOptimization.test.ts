import { describe, expect, it } from "vitest";
import { shouldBypassNextImageOptimization } from "@/lib/imageOptimization";

describe("shouldBypassNextImageOptimization", () => {
  it("bypasses static product and guide images", () => {
    expect(
      shouldBypassNextImageOptimization(
        "/images/products/accounting-ledger/template.webp",
      ),
    ).toBe(true);
    expect(
      shouldBypassNextImageOptimization(
        "/images/products/guides/ai-for-small-business.webp",
      ),
    ).toBe(true);
  });

  it("bypasses static tool thumbnail images", () => {
    expect(
      shouldBypassNextImageOptimization(
        "/images/tools/featured/profit-calculator.webp",
      ),
    ).toBe(true);
  });

  it("bypasses CMS blob images", () => {
    expect(
      shouldBypassNextImageOptimization(
        "https://simplebiztoolkit.blob.core.windows.net/images/template.webp?v=1",
      ),
    ).toBe(true);
  });

  it("leaves other public images optimized", () => {
    expect(
      shouldBypassNextImageOptimization("/images/hero-image-desk.webp"),
    ).toBe(false);
    expect(
      shouldBypassNextImageOptimization("/images/simple-biz-toolkit-logo.png"),
    ).toBe(false);
  });
});
