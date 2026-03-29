import "@testing-library/jest-dom/vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

    expect(productsLink).toHaveClass("is-active");
    expect(resourcesLink).not.toHaveClass("is-active");
  });

  it("marks a CMS dropdown trigger active when one of its pages matches the route", () => {
    mockUsePathname.mockReturnValue("/pages/services/payroll");
    render(
      <SiteNavigation
        menuNavItems={[
          {
            id: "menu-1",
            title: "Services",
            groups: [
              {
                categoryId: "cat-1",
                categoryTitle: "Operations",
                pages: [
                  {
                    id: "page-1",
                    title: "Payroll",
                    href: "/pages/services/payroll",
                  },
                ],
              },
            ],
          },
        ]}
      />,
    );

    const servicesTrigger = screen.getByRole("button", { name: /services/i });
    expect(servicesTrigger).toHaveClass("sb-site-nav-link");
    expect(servicesTrigger.parentElement).toHaveClass("is-active");
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
    expect(
      screen.getByRole("dialog", { name: "Site navigation" }),
    ).toHaveAttribute("aria-modal", "true");

    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));

    await waitFor(() => {
      expect(document.body.style.overflow).toBe("");
    });
  });

  it("interleaves CMS links with static nav when static order tokens are present", () => {
    mockUsePathname.mockReturnValue("/");
    render(
      <SiteNavigation
        menuNavItems={[
          {
            id: "menu-services",
            title: "Services",
            directHref: "/pages/services",
          },
        ]}
        navOrderIds={["static:/products", "menu-services", "static:/blog"]}
      />,
    );

    const desktopNav = document.querySelector(".sb-site-nav");
    expect(desktopNav).toBeTruthy();

    const names = within(desktopNav as HTMLElement)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim() ?? "");

    const templatesIndex = names.indexOf("Templates");
    const servicesIndex = names.indexOf("Services");
    const resourcesIndex = names.indexOf("Resources");

    expect(templatesIndex).toBeGreaterThan(-1);
    expect(servicesIndex).toBeGreaterThan(templatesIndex);
    expect(resourcesIndex).toBeGreaterThan(servicesIndex);
  });

  it("hides built-in links when hidden-static tokens are present", () => {
    mockUsePathname.mockReturnValue("/");
    render(
      <SiteNavigation
        menuNavItems={[
          {
            id: "menu-services",
            title: "Services",
            directHref: "/pages/services",
          },
        ]}
        navOrderIds={[
          "static:/products",
          "menu-services",
          "hidden-static:/blog",
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Resources" }),
    ).not.toBeInTheDocument();
  });
});
