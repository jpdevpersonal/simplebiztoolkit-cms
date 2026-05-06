import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    mockUsePathname.mockReturnValue("/templates");
    render(<SiteNavigation />);

    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reviews" })).toBeInTheDocument();
  });

  it("applies active styles to the link matching the current path", () => {
    mockUsePathname.mockReturnValue("/templates");
    render(<SiteNavigation />);

    const productsLink = screen.getByRole("link", { name: "Templates" });
    const reviewsLink = screen.getByRole("link", { name: "Reviews" });

    expect(productsLink).toHaveClass("is-active");
    expect(reviewsLink).not.toHaveClass("is-active");
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
    const user = userEvent.setup();
    mockUsePathname.mockReturnValue("/");
    render(<SiteNavigation />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Site navigation" }),
    ).toHaveAttribute("aria-modal", "true");

    await user.click(screen.getByRole("button", { name: "Close menu" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
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
        navOrderIds={["static:/products", "menu-services", "static:/faq"]}
      />,
    );

    const desktopNav = document.querySelector(".sb-site-nav");
    expect(desktopNav).toBeTruthy();

    const names = within(desktopNav as HTMLElement)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim() ?? "");

    const templatesIndex = names.indexOf("Templates");
    const servicesIndex = names.indexOf("Services");
    const faqIndex = names.indexOf("FAQ");

    expect(templatesIndex).toBeGreaterThan(-1);
    expect(servicesIndex).toBeGreaterThan(templatesIndex);
    expect(faqIndex).toBeGreaterThan(servicesIndex);
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
          "hidden-static:/faq",
        ]}
      />,
    );

    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "FAQ" })).not.toBeInTheDocument();
  });
});
