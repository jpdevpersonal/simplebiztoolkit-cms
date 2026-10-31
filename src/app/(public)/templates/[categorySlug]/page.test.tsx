import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
  getCategoryBySlug: vi.fn(),
  getProductCategories: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ apiService: apiMock }));

const category = {
  id: "c1",
  slug: "rent-payment-ledger",
  name: "Rent Payment Ledger",
  summary: "Track rent payments",
  howThisHelps: "Keeps landlords and tenants on the same page.",
  heroImage: "",
  items: [
    {
      title: "Rent Ledger A",
      slug: "rent-ledger-a",
      problem: "Simple record",
      bullets: [],
      image: "/images/a.webp",
      etsyUrl: "https://etsy.example/a",
      price: "$2.50",
      productPageUrl: "/templates/rent-payment-ledger/rent-ledger-a",
    },
    {
      title: "Rent Ledger B",
      slug: "rent-ledger-b",
      problem: "Another record",
      bullets: [],
      image: "/images/b.webp",
      etsyUrl: "https://etsy.example/b",
      price: "$1.99",
      productPageUrl: "/templates/rent-payment-ledger/rent-ledger-b",
    },
  ],
};

describe("Template category page", () => {
  beforeEach(() => {
    vi.resetModules();
    apiMock.getCategoryBySlug.mockReset();
    apiMock.getProductCategories.mockReset();
  });

  it("shows category facts, its templates and links to other categories", async () => {
    apiMock.getCategoryBySlug.mockResolvedValueOnce({ data: category });
    apiMock.getProductCategories.mockResolvedValueOnce({
      data: [category, { slug: "invoices", name: "Invoice" }],
    });

    const { default: CategoryPage } = await import("./page");
    render(
      await CategoryPage({
        params: Promise.resolve({ categorySlug: "rent-payment-ledger" }),
      }),
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Rent Payment Ledger" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 templates")).toBeInTheDocument();
    expect(screen.getByText("From $1.99")).toBeInTheDocument();
    expect(screen.getByText("How this helps")).toBeInTheDocument();
    expect(screen.getByText("Rent Ledger A")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See all 2 templates" })).toHaveAttribute(
      "href",
      "#items",
    );
    expect(screen.getByRole("link", { name: "Invoice" })).toHaveAttribute(
      "href",
      "/templates/invoices",
    );
    expect(
      screen.queryByRole("link", { name: "Rent Payment Ledger" }),
    ).not.toBeInTheDocument();
  });

  it("still renders when the category list request fails", async () => {
    apiMock.getCategoryBySlug.mockResolvedValueOnce({ data: category });
    apiMock.getProductCategories.mockResolvedValueOnce({ data: undefined });

    const { default: CategoryPage } = await import("./page");
    render(
      await CategoryPage({
        params: Promise.resolve({ categorySlug: "rent-payment-ledger" }),
      }),
    );

    expect(
      screen.queryByRole("navigation", { name: "Other template categories" }),
    ).not.toBeInTheDocument();
  });
});
