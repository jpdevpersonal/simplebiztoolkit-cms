import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SiteHeader from "./SiteHeader";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    usePathname: () => mockUsePathname(),
  };
});

vi.mock("./SiteNavigation", () => ({
  default: () => <div>Site nav component</div>,
}));

vi.mock("@/components/EtsyCtaButton", () => ({
  default: () => <div>Etsy CTA</div>,
}));

describe("SiteHeader", () => {
  it("renders nav and CTA on non-admin routes", () => {
    mockUsePathname.mockReturnValue("/");
    render(<SiteHeader />);

    expect(screen.getByText("Site nav component")).toBeInTheDocument();
  });

  it("hides nav and CTA on admin routes", () => {
    mockUsePathname.mockReturnValue("/admin/products");
    render(<SiteHeader />);

    expect(screen.queryByText("Site nav component")).not.toBeInTheDocument();
  });
});
