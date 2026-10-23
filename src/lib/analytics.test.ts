import { afterEach, describe, expect, it, vi } from "vitest";
import { trackPublicEvent, trackPublicPageView } from "./analytics";

describe("trackPublicEvent", () => {
  afterEach(() => {
    delete (window as Window & { gtag?: unknown }).gtag;
    delete (window as Window & { __sbtLastPublicPageView?: string })
      .__sbtLastPublicPageView;
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

  it("tracks a clean public pathname once and does not include query data", () => {
    const gtag = vi.fn();
    (window as Window & { gtag?: typeof gtag }).gtag = gtag;

    trackPublicPageView("/templates?email=private@example.com");
    trackPublicPageView("/templates?another=secret");

    expect(gtag).toHaveBeenCalledOnce();
    expect(gtag).toHaveBeenCalledWith("event", "page_view", {
      page_location: `${window.location.origin}/templates`,
    });
  });

  it.each([
    "/admin/login",
    "/cms",
    "/cms/",
    "/cms/faqs",
    "/CMS/templates",
    "/preview/pages/1",
    "/api/products",
    "/auth/login",
    "//external.example/path",
    "https://external.example/path",
  ])(
    "does not track private route %s",
    (pathname) => {
      const gtag = vi.fn();
      (window as Window & { gtag?: typeof gtag }).gtag = gtag;

      trackPublicPageView(pathname);

      expect(gtag).not.toHaveBeenCalled();
    },
  );
});
