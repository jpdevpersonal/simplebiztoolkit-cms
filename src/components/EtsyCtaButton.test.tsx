import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EtsyCtaButton from "./EtsyCtaButton";

const mockUsePathname = vi.fn();
const trackPublicEventMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/analytics", () => ({
  trackPublicEvent: trackPublicEventMock,
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

describe("EtsyCtaButton", () => {
  it("hides on home by default", () => {
    mockUsePathname.mockReturnValue("/");
    const { container } = render(<EtsyCtaButton />);
    expect(container.firstChild).toBeNull();
  });

  it("renders when hideOnHome is false", () => {
    mockUsePathname.mockReturnValue("/");
    render(<EtsyCtaButton hideOnHome={false} label="Shop Etsy" />);

    expect(screen.getByRole("link", { name: "Shop Etsy" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
  });

  it("renders on non-home routes with default hideOnHome", () => {
    mockUsePathname.mockReturnValue("/templates");
    render(<EtsyCtaButton />);
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
  });

  it("tracks its placement and preserves the supplied click handler", () => {
    mockUsePathname.mockReturnValue("/templates");
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) =>
      event.preventDefault(),
    );
    render(
      <EtsyCtaButton analyticsPlacement="templates_footer" onClick={onClick} />,
    );

    fireEvent.click(screen.getByRole("link"));

    expect(trackPublicEventMock).toHaveBeenCalledWith("outbound_etsy_click", {
      placement: "templates_footer",
      destination_type: "etsy",
    });
    expect(onClick).toHaveBeenCalledOnce();
  });
});
