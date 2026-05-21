import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
  getProductById: vi.fn(),
  getProductCategories: vi.fn(),
}));

const redirectMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
);

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    redirect: redirectMock,
    notFound: notFoundMock,
  };
});

vi.mock("@/app/admin/_lib/getAdminApiService", () => ({
  getAdminApiService: vi.fn(async () => ({
    service: serviceMock,
    session: { user: { email: "admin@example.com" } },
  })),
}));

vi.mock(
  "@/app/(public)/templates/[categorySlug]/[productSlug]/ProductDetailClient",
  () => ({
    __esModule: true,
    default: ({ product }: { product: { title: string } }) => (
      <div>{product.title}</div>
    ),
  }),
);

describe("ProductPreviewPage", () => {
  beforeEach(() => {
    vi.resetModules();
    serviceMock.getProductById.mockReset();
    serviceMock.getProductCategories.mockReset();
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it("renders a saved draft template using the admin product endpoint", async () => {
    serviceMock.getProductById.mockResolvedValueOnce({
      data: {
        id: "p-1",
        title: "Draft Template",
        status: "draft",
        categoryId: "cat-1",
        problem: "",
        description: "",
        bullets: [],
        image: "",
        etsyUrl: "",
        price: "",
      },
    });
    serviceMock.getProductCategories.mockResolvedValueOnce({
      data: [{ id: "cat-1", slug: "spreadsheets", name: "Spreadsheets" }],
    });

    const { default: ProductPreviewPage } = await import("./page");
    render(
      await ProductPreviewPage({
        params: Promise.resolve({ id: "p-1" }),
      }),
    );

    expect(serviceMock.getProductById).toHaveBeenCalledWith("p-1");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Previewing saved draft template.",
    );
    expect(screen.getByText("Draft Template")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spreadsheets" })).toHaveAttribute(
      "href",
      "/templates/spreadsheets",
    );
  });

  it("redirects to login when session is not present", async () => {
    const { getAdminApiService } =
      await import("@/app/admin/_lib/getAdminApiService");
    (getAdminApiService as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      service: serviceMock,
      session: null,
    });

    const { default: ProductPreviewPage } = await import("./page");

    await expect(
      ProductPreviewPage({ params: Promise.resolve({ id: "p-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/cms/login");
  });

  it("calls notFound when product data is not returned", async () => {
    serviceMock.getProductById.mockResolvedValueOnce({ data: null });
    serviceMock.getProductCategories.mockResolvedValueOnce({ data: [] });

    const { default: ProductPreviewPage } = await import("./page");

    await expect(
      ProductPreviewPage({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
