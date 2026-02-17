import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminProductsTable from "./AdminProductsTable";
import { clientApi } from "@/lib/clientApi";

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    getAllProductCategories: vi.fn(),
  },
}));

const categories = [
  {
    id: "cat-1",
    slug: "cat-1",
    name: "Category One",
    summary: "",
    howThisHelps: "",
    heroImage: "",
    items: [],
  },
];

const products = [
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
    categoryId: "cat-1",
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

    fireEvent.click(screen.getByRole("button", { name: /status/i }));
    const rows = container.querySelectorAll("tbody tr");
    const firstRowCells = within(rows[0]).getAllByRole("cell");
    expect(firstRowCells[0]).toHaveTextContent("Zeta");
  });

  it("shows empty state when products are empty", () => {
    vi.mocked(clientApi.getAllProductCategories).mockRejectedValueOnce(
      new Error("ignore"),
    );
    render(<AdminProductsTable products={[]} categories={categories} />);

    expect(
      screen.getByText(/No products found. Create your first product!/i),
    ).toBeInTheDocument();
  });
});
