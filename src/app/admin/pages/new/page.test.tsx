import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
  getMenuItems: vi.fn(),
}));

const pageEditorMock = vi.hoisted(() => vi.fn());

vi.mock("@/app/admin/_lib/getAdminApiService", () => ({
  getAdminApiService: vi.fn(async () => ({ service: serviceMock })),
}));

vi.mock("../PageEditor", () => ({
  __esModule: true,
  default: (props: any) => {
    pageEditorMock(props);
    return <div>Mock PageEditor</div>;
  },
}));

describe("NewPageAdminPage", () => {
  beforeEach(() => {
    vi.resetModules();
    serviceMock.getMenuItems.mockReset();
    pageEditorMock.mockReset();
  });

  it("renders the new page editor with query-param preselection", async () => {
    serviceMock.getMenuItems.mockResolvedValueOnce({
      data: [{ id: "menu-1", title: "Guides" }],
    });

    const { default: NewPageAdminPage } = await import("./page");
    render(
      await NewPageAdminPage({
        searchParams: Promise.resolve({
          menuItemId: "menu-1",
          categoryId: "cat-1",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "New Page" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Pages" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Pages" })[0]).toHaveAttribute(
      "href",
      "/admin/pages",
    );
    expect(pageEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        menuItems: [{ id: "menu-1", title: "Guides" }],
        initialMenuItemId: "menu-1",
        initialCategoryId: "cat-1",
        isNew: true,
      }),
    );
  });

  it("falls back to an empty menu-items list when the API response has no data", async () => {
    serviceMock.getMenuItems.mockResolvedValueOnce({ data: undefined });

    const { default: NewPageAdminPage } = await import("./page");
    render(
      await NewPageAdminPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(pageEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        menuItems: [],
        initialMenuItemId: undefined,
        initialCategoryId: undefined,
        isNew: true,
      }),
    );
  });
});
