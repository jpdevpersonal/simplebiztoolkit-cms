import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductEditor from "./ProductEditor";
import { clientApi } from "@/lib/clientApi";
import { serializeRelatedLinksBlockToHtml } from "@/lib/relatedLinks";

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
    getMenuItemPages: vi.fn(),
    getProductCategories: vi.fn(),
  },
}));

vi.mock("@/components/AdminModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onCloseAction,
    title,
    children,
  }: {
    isOpen: boolean;
    onCloseAction: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div data-testid="admin-modal" data-title={title}>
        <button type="button" onClick={onCloseAction} aria-label="Close modal">
          Close
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/RichContentField", () => ({
  __esModule: true,
  default: ({
    label,
    value,
    storageKey,
    onChange,
    onPopOut,
  }: {
    label?: string;
    value?: string;
    storageKey?: string;
    onChange?: (next: string) => void;
    onPopOut?: () => void;
  }) => (
    <div data-testid={`rich-content-${storageKey}`}>
      {label ? <label>{label}</label> : null}
      <textarea
        aria-label={label || storageKey || "rich-content"}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {onPopOut ? (
        <button
          type="button"
          onClick={onPopOut}
          aria-label="Open editor in full screen"
        >
          Open editor in full screen
        </button>
      ) : null}
    </div>
  ),
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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientApi.getMenuItemPages).mockResolvedValue([] as any);
    vi.mocked(clientApi.getProductCategories).mockResolvedValue(
      categories as any,
    );
  });

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

    await waitFor(
      () => {
        expect(clientApi.createProduct).toHaveBeenCalled();
        expect(routerPush).toHaveBeenCalledWith("/admin/templates");
        expect(routerRefresh).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
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

    await waitFor(
      () => {
        expect(clientApi.updateProduct).toHaveBeenCalledWith(
          "p-1",
          expect.any(Object),
        );
        expect(routerPush).toHaveBeenCalledWith("/admin/templates");
        expect(routerRefresh).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
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

    const alert = await screen.findByRole("alert", {}, { timeout: 2000 });
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toBe("Network timeout");
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

    await waitFor(
      () => {
        expect(clientApi.deleteProduct).toHaveBeenCalledWith("p-1");
        expect(routerPush).toHaveBeenCalledWith("/admin/templates");
      },
      { timeout: 2000 },
    );
  });

  it("keeps related links in their own section and reserializes them on save", async () => {
    const relatedLinksHtml = serializeRelatedLinksBlockToHtml({
      title: "Related to this",
      items: [
        {
          uid: "link-1",
          kind: "page",
          refId: "page-1",
          href: "/bookkeeping",
          destinationTitle: "Bookkeeping",
          label: null,
          imageId: null,
          imageUrl: null,
          imageAlt: null,
        },
      ],
    });

    vi.mocked(clientApi.updateProduct).mockResolvedValueOnce({
      id: "p-1",
      title: "Old Product",
      slug: "old-product",
      problem: "",
      description: `<p>Main description</p>\n${relatedLinksHtml}`,
      bullets: [],
      image: "",
      etsyUrl: "",
      productPageUrl: "",
      price: "",
      categoryId: "cat-1",
      status: "draft",
    } as any);

    const { container } = render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "Old Product",
          slug: "old-product",
          problem: "",
          description: `<p>Main description</p>\n${relatedLinksHtml}`,
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

    expect(screen.getByText("Related Links")).toBeInTheDocument();
    const descriptionField = container.querySelectorAll("textarea")[1];
    expect(descriptionField).toBeTruthy();
    expect((descriptionField as HTMLTextAreaElement).value).toBe(
      "<p>Main description</p>",
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(
      () => {
        expect(clientApi.updateProduct).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );

    const payload = vi.mocked(clientApi.updateProduct).mock.calls[0]?.[1] as {
      description?: string;
    };
    expect(payload.description).toContain("<p>Main description</p>");
    expect(payload.description).toContain('data-sbt-block="related-links"');
  });

  it("renders pop-out buttons for Problem Statement and Description fields", () => {
    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "My Product",
          slug: "my-product",
          problem: "<p>A problem</p>",
          description: "<p>A description</p>",
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

    const popOutBtns = screen.getAllByRole("button", {
      name: "Open editor in full screen",
    });
    expect(popOutBtns).toHaveLength(2);
  });

  it("opens Problem Statement modal when its pop-out button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "My Product",
          slug: "my-product",
          problem: "<p>A problem</p>",
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

    expect(screen.queryByTestId("admin-modal")).not.toBeInTheDocument();

    const [problemPopOut] = screen.getAllByRole("button", {
      name: "Open editor in full screen",
    });
    await user.click(problemPopOut);

    expect(screen.getByTestId("admin-modal")).toBeInTheDocument();
    expect(screen.getByTestId("admin-modal")).toHaveAttribute(
      "data-title",
      "Problem Statement",
    );
  });

  it("opens Description modal when its pop-out button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "My Product",
          slug: "my-product",
          problem: "",
          description: "<p>A description</p>",
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

    const [, descriptionPopOut] = screen.getAllByRole("button", {
      name: "Open editor in full screen",
    });
    await user.click(descriptionPopOut);

    expect(screen.getByTestId("admin-modal")).toBeInTheDocument();
    expect(screen.getByTestId("admin-modal")).toHaveAttribute(
      "data-title",
      "Description",
    );
  });

  it("closes the content modal when close is clicked", async () => {
    const user = userEvent.setup();

    render(
      <ProductEditor
        categories={categories}
        product={{
          id: "p-1",
          title: "My Product",
          slug: "my-product",
          problem: "<p>A problem</p>",
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

    const [problemPopOut] = screen.getAllByRole("button", {
      name: "Open editor in full screen",
    });
    await user.click(problemPopOut);
    expect(screen.getByTestId("admin-modal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close modal" }));
    await waitFor(
      () => {
        expect(screen.queryByTestId("admin-modal")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });
});
