import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteNavigation from "./SiteNavigation";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<any>("react-dom");
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <a href="/etsy">Etsy CTA</a>,
}));

describe("SiteNavigation", () => {
  it("renders desktop links", () => {
    mockUsePathname.mockReturnValue("/products");
    render(<SiteNavigation />);

    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Resources" })).toBeInTheDocument();
  });

  it("applies active styles to the link matching the current path", () => {
    mockUsePathname.mockReturnValue("/products");
    render(<SiteNavigation />);

    const productsLink = screen.getByRole("link", { name: "Templates" });
    const resourcesLink = screen.getByRole("link", { name: "Resources" });

    // Active link gets brand colour; inactive links do not
    expect(productsLink).toHaveStyle("color: var(--sb-brand-blue)");
    expect(resourcesLink).not.toHaveStyle("color: var(--sb-brand-blue)");
  });

  it("opens and closes mobile menu", async () => {
    mockUsePathname.mockReturnValue("/");
    render(<SiteNavigation />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Open menu" }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });
});
