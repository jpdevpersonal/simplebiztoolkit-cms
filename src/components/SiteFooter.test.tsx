import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteFooter from "./SiteFooter";

describe("SiteFooter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-03T12:00:00.000Z"));
  });

  it("renders key links and current year", () => {
    render(<SiteFooter />);

    expect(screen.getByRole("link", { name: "Templates" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(screen.getByRole("link", { name: "Etsy Shop" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
    expect(screen.getByRole("link", { name: "Etsy messages" })).toHaveAttribute(
      "href",
      "https://www.etsy.com/shop/simplebiztoolkit",
    );
    expect(screen.getByRole("heading", { name: "Shop" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Support" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Company" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Explore" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/© 2026/)).toBeInTheDocument();
  });

  it("renders custom CMS links in Explore while keeping static links in their original sections", () => {
    render(
      <SiteFooter
        menuNavItems={[
          {
            id: "menu-guides",
            title: "Guides",
            directHref: "/pages/guides",
          },
        ]}
        navOrderIds={["static:/products", "menu-guides", "hidden-static:/faq"]}
      />,
    );

    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute(
      "href",
      "/pages/guides",
    );
    expect(screen.queryByRole("link", { name: "FAQ" })).not.toBeInTheDocument();
    const exploreHeading = screen.getByRole("heading", { name: "Explore" });
    const exploreColumn = exploreHeading.closest(
      ".sb-footer-col",
    ) as HTMLElement;
    expect(exploreColumn).toContainElement(
      screen.getByRole("link", { name: "Guides" }),
    );
  });
});
