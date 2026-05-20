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
        name: "Printable small business templates",
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
        name: "Printable small business templates",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Accounting Ledger")).toBeInTheDocument();
    expect(screen.getByText("Track your transactions")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Accounting Ledger/i }),
    ).toHaveAttribute("href", "/templates/accounting-ledger");
  });

  it("treats an undefined categories payload as an empty list", async () => {
    getProductCategoriesMock.mockResolvedValueOnce({ data: undefined });

    const { default: ProductsPage } = await import("./page");
    render(await ProductsPage());

    expect(
      screen.getByRole("heading", {
        name: "Printable small business templates",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Browse templates/i }),
    ).not.toBeInTheDocument();
  });
});
