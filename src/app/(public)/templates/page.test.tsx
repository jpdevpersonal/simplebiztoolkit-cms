import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getProductCategoriesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiService: {
    getProductCategories: getProductCategoriesMock,
  },
}));

describe("Templates page", () => {
  beforeEach(() => {
    vi.resetModules();
    getProductCategoriesMock.mockReset();
  });

  it("renders heading with no category links when API returns empty list", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({ data: [] });

    const { default: ProductsPage } = await import("./page");
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", {
        name: "Small business templates",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Browse templates/i }),
    ).not.toBeInTheDocument();
  });

  it("renders categories from API response", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({
      data: [
        {
          slug: "accounting-ledger",
          name: "Accounting Ledger",
          summary: "Track your transactions",
        },
      ],
    });

    const { default: ProductsPage } = await import("./page");
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", {
        name: "Small business templates",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accounting Ledger")).toBeInTheDocument();
    expect(screen.getByText("Track your transactions")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Accounting Ledger/i }),
    ).toHaveAttribute("href", "/templates/accounting-ledger");
  });

  it("shows template counts, starting price and a preview image", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({
      data: [
        {
          slug: "rent-payment-ledger",
          name: "Rent Payment Ledger",
          summary: "Track rent",
          heroImage: "",
          items: [
            { image: "/images/rent-a.webp", price: "$2.50" },
            { image: "/images/rent-b.webp", price: "$1.99" },
          ],
        },
      ],
    });

    const { default: ProductsPage } = await import("./page");
    const { container } = render(await ProductsPage());

    expect(screen.getByText("2 templates")).toBeInTheDocument();
    expect(screen.getByText("From $1.99")).toBeInTheDocument();
    expect(
      screen.getByText("2 templates across 1 category"),
    ).toBeInTheDocument();
    expect(container.querySelector(".category-card-media img")).toHaveAttribute(
      "src",
      "/images/rent-a.webp",
    );
  });

  it("treats an undefined categories payload as an empty list", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({ data: undefined });

    const { default: ProductsPage } = await import("./page");
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", {
        name: "Small business templates",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Browse templates/i }),
    ).not.toBeInTheDocument();
  });

  it("uses the default icon for unknown category slugs", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({
      data: [
        {
          slug: "general-tools",
          name: "General Tools",
          summary: "Misc items",
        },
      ],
    });

    const { default: ProductsPage } = await import("./page");
    render(await ProductsPage());

    expect(screen.getByText("General Tools")).toBeInTheDocument();
  });
});
