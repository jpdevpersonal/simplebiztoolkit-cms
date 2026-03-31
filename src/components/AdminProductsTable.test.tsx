import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProductItem, ProductCategory } from "@/lib/api";
import AdminProductsTable from "./AdminProductsTable";
import { clientApi } from "@/lib/clientApi";

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    getAllProductCategories: vi.fn(),
  },
}));

const categories: ProductCategory[] = [
  {
    id: "cat-1",
    slug: "cat-1",
    name: "Apples",
    summary: "",
    howThisHelps: "",
    heroImage: "",
    items: [],
  },
  {
    id: "cat-2",
    slug: "cat-2",
    name: "Zucchini",
    summary: "",
    howThisHelps: "",
    heroImage: "",
    items: [],
  },
];

const products: ProductItem[] = [
  {
    id: "p-2",
    title: "Zeta",
    slug: "zeta",
    problem: "",
    description: "",
    bullets: [],
    image: "",
    etsyUrl: "",
    productPageUrl: "",
    price: "$12",
    categoryId: "cat-2",
    status: "draft" as const,
  },
  {
    id: "p-1",
    title: "Alpha",
    slug: "alpha",
    problem: "",
    description: "",
    bullets: [],
    image: "",
    etsyUrl: "",
    productPageUrl: "",
    price: "$10",
    categoryId: "cat-1",
    status: "published" as const,
  },
];

describe("AdminProductsTable", () => {
  it("renders rows and edit links", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    render(<AdminProductsTable products={products} categories={categories} />);

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    const editLinks = screen.getAllByRole("link", { name: "Edit" });
    expect(editLinks[0]).toHaveAttribute("href", "/admin/products/p-1/edit");
  });

  it("sorts by status when header is clicked", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    // header is rendered as a sortable column header (<th>), not a button
    fireEvent.click(screen.getByRole("columnheader", { name: /status/i }));
    const rows = container.querySelectorAll("tbody tr");
    const firstRowCells = within(rows[0]!).getAllByRole("cell");
    expect(firstRowCells[0]).toHaveTextContent("Zeta");
  });

  it("shows empty state when products are empty", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    render(<AdminProductsTable products={[]} categories={categories} />);

    expect(
      screen.getByText(/No templates found. Create your first template!/i),
    ).toBeInTheDocument();
  });

  it("renders a View link in the Preview column when productPageUrl is set", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const productsWithUrl = [
      {
        ...products[1], // Alpha
        productPageUrl: "/products/cat-1/alpha",
      },
    ];
    render(
      <AdminProductsTable products={productsWithUrl} categories={categories} />,
    );

    const viewLink = screen.getByRole("link", { name: /View/i });
    expect(viewLink).toHaveAttribute("href", "/products/cat-1/alpha");
    expect(viewLink).toHaveAttribute("target", "_blank");
  });

  it("renders a dash in the Preview column when productPageUrl is empty", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    // products[0] (Zeta) has productPageUrl: ""
    render(
      <AdminProductsTable products={[products[0]]} categories={categories} />,
    );

    expect(
      screen.queryByRole("link", { name: /View/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("\u2014")).toBeInTheDocument(); // em dash
  });

  it("toggles title sort to descending on second click", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    // Default: title asc -> Alpha first
    let rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Alpha");

    // Click Title header to flip to desc -> Zeta first
    fireEvent.click(screen.getByRole("columnheader", { name: /title/i }));
    rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Zeta");
  });

  it("sorts by category asc when Category header is clicked", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    fireEvent.click(screen.getByRole("columnheader", { name: /category/i }));
    const rows = container.querySelectorAll("tbody tr");
    // Apples (cat-1 → Alpha) before Zucchini (cat-2 → Zeta)
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Alpha");
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent("Zeta");
  });

  it("sorts by category desc on second click of Category header", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    const categoryHeader = screen.getByRole("columnheader", {
      name: /category/i,
    });
    fireEvent.click(categoryHeader); // asc
    fireEvent.click(categoryHeader); // desc
    const rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Zeta");
  });

  it("sorts by price asc when Price header is clicked", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    fireEvent.click(screen.getByRole("columnheader", { name: /price/i }));
    const rows = container.querySelectorAll("tbody tr");
    // $10 (Alpha) before $12 (Zeta)
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Alpha");
    expect(within(rows[1]!).getAllByRole("cell")[0]).toHaveTextContent("Zeta");
  });

  it("sorts by price desc on second click of Price header", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    const priceHeader = screen.getByRole("columnheader", { name: /price/i });
    fireEvent.click(priceHeader); // asc
    fireEvent.click(priceHeader); // desc
    const rows = container.querySelectorAll("tbody tr");
    // $12 (Zeta) first
    expect(within(rows[0]!).getAllByRole("cell")[0]).toHaveTextContent("Zeta");
  });

  it("has data-label attributes on all visible cells for mobile card layout", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    const { container } = render(
      <AdminProductsTable products={products} categories={categories} />,
    );

    const firstRow = container.querySelector("tbody tr")!;
    const cells = firstRow.querySelectorAll("td");
    const expectedLabels = [
      "Title",
      "Category",
      "Price",
      "Status",
      "Preview",
      "Actions",
    ];

    cells.forEach((cell, i) => {
      expect(cell.getAttribute("data-label")).toBe(expectedLabels[i]);
    });
  });
});
