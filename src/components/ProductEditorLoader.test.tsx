import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductEditorLoader from "./ProductEditorLoader";
import { clientApi } from "@/lib/clientApi";

vi.mock("@/components/ProductEditor", () => ({
  default: ({ product }: { product: { title: string } }) => (
    <div>Editor: {product.title}</div>
  ),
}));

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    getProductById: vi.fn(),
    getProductCategories: vi.fn(),
  },
}));

describe("ProductEditorLoader", () => {
  it("shows loading then renders ProductEditor", async () => {
    vi.mocked(clientApi.getProductById).mockResolvedValueOnce({
      id: "p-1",
      title: "Loaded Product",
      slug: "loaded-product",
      problem: "",
      bullets: [],
      image: "",
      etsyUrl: "",
      price: "",
      categoryId: "cat-1",
      status: "draft",
    } as any);
    vi.mocked(clientApi.getProductCategories).mockResolvedValueOnce([] as any);

    render(<ProductEditorLoader id="p-1" />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Editor: Loaded Product")).toBeInTheDocument();
    });
  });

  it("shows not-found message when product is missing", async () => {
    vi.mocked(clientApi.getProductById).mockResolvedValueOnce(null as any);
    vi.mocked(clientApi.getProductCategories).mockResolvedValueOnce([] as any);

    render(<ProductEditorLoader id="missing" />);

    await waitFor(() => {
      expect(screen.getByText(/Product not found/i)).toBeInTheDocument();
    });
  });
});
