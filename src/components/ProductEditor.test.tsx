import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductEditor from "./ProductEditor";
import { clientApi } from "@/lib/clientApi";

const routerPush = vi.fn();
const routerRefresh = vi.fn();
const routerBack = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
      refresh: routerRefresh,
      back: routerBack,
    }),
  };
});

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    revalidateContent: vi.fn(),
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

describe("ProductEditor", () => {
  it("creates product in create mode", async () => {
    vi.mocked(clientApi.createProduct).mockResolvedValueOnce({
      id: "new-id",
      title: "My Product",
      slug: "my-product",
      problem: "",
      bullets: [],
      image: "",
      etsyUrl: "",
      price: "",
      categoryId: "cat-1",
      status: "draft",
    } as any);

    const { container } = render(<ProductEditor categories={categories} />);
    const inputs = container.querySelectorAll("input.form-control");

    fireEvent.change(inputs[0], {
      target: { value: "My Product" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "my-product" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Template" }));

    await waitFor(() => {
      expect(clientApi.createProduct).toHaveBeenCalled();
      expect(clientApi.revalidateContent).toHaveBeenCalledWith(
        "product",
        "my-product",
      );
      expect(routerPush).toHaveBeenCalledWith("/admin/templates");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("saves changes in edit mode and redirects to products", async () => {
    vi.mocked(clientApi.updateProduct).mockResolvedValueOnce({
      id: "p-1",
      title: "Old Product",
      slug: "old-product",
      problem: "",
      description: "",
      bullets: [],
      image: "",
      etsyUrl: "",
      productPageUrl: "",
      price: "",
      categoryId: "cat-1",
      status: "draft",
    } as any);

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "Old Product",
          slug: "old-product",
          problem: "",
          description: "",
          bullets: [],
          image: "",
          etsyUrl: "",
          productPageUrl: "",
          price: "",
          categoryId: "cat-1",
          status: "draft",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateProduct).toHaveBeenCalledWith(
        "p-1",
        expect.any(Object),
      );
      expect(clientApi.revalidateContent).toHaveBeenCalledWith(
        "product",
        "old-product",
      );
      expect(routerPush).toHaveBeenCalledWith("/admin/templates");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("renders preview links for an existing saved draft template", () => {
    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "Old Product",
          slug: "old-product",
          problem: "",
          description: "",
          bullets: [],
          image: "",
          etsyUrl: "",
          productPageUrl: "",
          price: "",
          categoryId: "cat-1",
          status: "draft",
        }}
      />,
    );

    expect(screen.getByRole("link", { name: /preview/i })).toHaveAttribute(
      "href",
      "/preview/templates/p-1",
    );
  });

  it("does not render preview links for a new unsaved template", () => {
    render(<ProductEditor categories={categories} />);

    expect(
      screen.queryByRole("link", { name: /preview/i }),
    ).not.toBeInTheDocument();
  });

  it("shows error message when save fails in edit mode", async () => {
    vi.mocked(clientApi.updateProduct).mockRejectedValueOnce(
      new Error("Network timeout"),
    );

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "Old Product",
          slug: "old-product",
          problem: "",
          description: "",
          bullets: [],
          image: "",
          etsyUrl: "",
          productPageUrl: "",
          price: "",
          categoryId: "cat-1",
          status: "draft",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toBe("Network timeout");
    });
  });

  it("deletes product in edit mode after confirmation", async () => {
    vi.mocked(clientApi.deleteProduct).mockResolvedValueOnce(undefined as any);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "Old Product",
          slug: "old-product",
          problem: "",
          description: "",
          bullets: [],
          image: "",
          etsyUrl: "",
          productPageUrl: "",
          price: "",
          categoryId: "cat-1",
          status: "draft",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Template" }));

    await waitFor(() => {
      expect(clientApi.deleteProduct).toHaveBeenCalledWith("p-1");
      expect(clientApi.revalidateContent).toHaveBeenCalledWith(
        "product",
        "old-product",
      );
      expect(routerPush).toHaveBeenCalledWith("/admin/templates");
    });
  });
});
