import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GoogleAnalyticsPageTracker from "./GoogleAnalyticsPageTracker";

const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
    useSearchParams: () => mockUseSearchParams(),
  };
});

describe("GoogleAnalyticsPageTracker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tracks client-side page changes after the initial render", () => {
    const gtag = vi.fn();

    vi.stubGlobal("gtag", gtag);
    document.title = "Simple Biz Toolkit";

    mockUsePathname.mockReturnValue("/");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());

    const ids = ["G-3ZQY64S5JJ", "GT-KDQ6DHFZ"];

    const { rerender } = render(
      <GoogleAnalyticsPageTracker measurementIds={ids} />,
    );

    expect(gtag).not.toHaveBeenCalled();

    mockUsePathname.mockReturnValue("/templates");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("category=forms"));

    rerender(<GoogleAnalyticsPageTracker measurementIds={ids} />);

    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/templates?category=forms",
        page_title: "Simple Biz Toolkit",
        send_to: "G-3ZQY64S5JJ",
      }),
    );
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "page_view",
      expect.objectContaining({
        page_path: "/templates?category=forms",
        page_title: "Simple Biz Toolkit",
        send_to: "GT-KDQ6DHFZ",
      }),
    );
  });
});
