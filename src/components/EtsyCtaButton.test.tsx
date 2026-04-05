import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import EtsyCtaButton from "./EtsyCtaButton";

const mockUsePathname = vi.fn();

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
});
