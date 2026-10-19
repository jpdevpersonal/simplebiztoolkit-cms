import { afterEach, describe, expect, it, vi } from "vitest";
import { trackPublicEvent } from "./analytics";

describe("trackPublicEvent", () => {
  afterEach(() => {
    delete (window as Window & { gtag?: unknown }).gtag;
  });

  it("sends a typed event through gtag", () => {
    const gtag = vi.fn();
    (window as Window & { gtag?: typeof gtag }).gtag = gtag;

    trackPublicEvent("outbound_etsy_click", {
      placement: "product_detail_primary",
      destination_type: "etsy",
      product_slug: "budget-planner",
    });

    expect(gtag).toHaveBeenCalledWith("event", "outbound_etsy_click", {
      placement: "product_detail_primary",
      destination_type: "etsy",
      product_slug: "budget-planner",
    });
  });

  it("does not throw when analytics is unavailable", () => {
    expect(() =>
      trackPublicEvent("cta_click", {
        placement: "homepage_hero",
        destination_type: "template_category",
      }),
    ).not.toThrow();
  });
});
