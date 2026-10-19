import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SiteFooter from "./SiteFooter";

const getStatsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiService: {
    getStats: getStatsMock,
  },
}));

const ALL_STATS = [
  { id: 1, name: "rating", value: "4.9", hidden: false },
  { id: 2, name: "reviews", value: "1250", hidden: false },
  { id: 3, name: "sales", value: "2500+", hidden: false },
  { id: 4, name: "star-seller", value: "Yes", hidden: false },
];

async function renderFooter(props?: ComponentProps<typeof SiteFooter>) {
  render(await SiteFooter(props ?? {}));
}

describe("SiteFooter", () => {
  beforeEach(() => {
    getStatsMock.mockReset();
  });

  it("renders key links and DB-backed trust stats", async () => {
    getStatsMock.mockResolvedValueOnce({ data: ALL_STATS, statusCode: 200 });

    await renderFooter();

    expect(screen.getByRole("link", { name: "Templates" })).toHaveAttribute(
      "href",
      "/templates",
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
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(new RegExp(`© ${currentYear}`)),
    ).toBeInTheDocument();
    expect(screen.getByText(/4\.9 average rating/i)).toBeInTheDocument();
    expect(screen.getByText(/1250 Etsy reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/2500\+ sales/i)).toBeInTheDocument();
    expect(screen.getByText(/Etsy Star Seller/i)).toBeInTheDocument();
  });

  it("hides trust stats when DB stats are unavailable", async () => {
    getStatsMock.mockRejectedValueOnce(new Error("stats unavailable"));

    await renderFooter();

    expect(screen.queryByText(/average rating/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Etsy reviews/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/sales/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Etsy Star Seller/i)).not.toBeInTheDocument();
  });

  it("renders custom CMS links in Explore while keeping static links in their original sections", async () => {
    getStatsMock.mockResolvedValueOnce({ data: ALL_STATS, statusCode: 200 });

    await renderFooter({
      menuNavItems: [
        {
          id: "menu-guides",
          title: "Guides",
          directHref: "/pages/guides",
        },
      ],
      navOrderIds: ["static:/products", "menu-guides", "hidden-static:/faq"],
    });

    expect(screen.getByRole("link", { name: "Templates" })).toHaveAttribute(
      "href",
      "/templates",
    );
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
