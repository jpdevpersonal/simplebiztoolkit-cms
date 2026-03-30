import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
  getMenuItemPageById: vi.fn(),
  getMenuItems: vi.fn(),
  getMenuCategoryById: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

const pageEditorMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    notFound: notFoundMock,
  };
});

vi.mock("@/app/admin/_lib/getAdminApiService", () => ({
  getAdminApiService: vi.fn(async () => ({ service: serviceMock })),
}));

vi.mock("../../PageEditor", () => ({
  __esModule: true,
  default: (props: any) => {
    pageEditorMock(props);
    return <div>Mock PageEditor</div>;
  },
}));

describe("EditPageAdminPage", () => {
  beforeEach(() => {
    vi.resetModules();
    serviceMock.getMenuItemPageById.mockReset();
    serviceMock.getMenuItems.mockReset();
    serviceMock.getMenuCategoryById.mockReset();
    pageEditorMock.mockReset();
    notFoundMock.mockClear();
  });

  it("calls notFound when the requested page does not exist", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({ data: null });
    serviceMock.getMenuItems.mockResolvedValueOnce({ data: [] });

    const { default: EditPageAdminPage } = await import("./page");

    await expect(
      EditPageAdminPage({
        params: Promise.resolve({ id: "missing" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("derives the menu item id from the category when the page does not include one", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({
      data: {
        id: "page-1",
        title: "Edit Page",
        menuItemId: undefined,
        menuCategoryId: "cat-1",
      },
    });
    serviceMock.getMenuItems.mockResolvedValueOnce({
      data: [{ id: "menu-1", title: "Guides" }],
    });
    serviceMock.getMenuCategoryById.mockResolvedValueOnce({
      data: { id: "cat-1", menuItemId: "menu-1" },
    });

    const { default: EditPageAdminPage } = await import("./page");
    render(
      await EditPageAdminPage({
        params: Promise.resolve({ id: "page-1" }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Edit Page" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ID: page-1")).toBeInTheDocument();
    expect(serviceMock.getMenuCategoryById).toHaveBeenCalledWith("cat-1");
    expect(pageEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        page: expect.objectContaining({ id: "page-1" }),
        menuItems: [{ id: "menu-1", title: "Guides" }],
        initialMenuItemId: "menu-1",
        initialCategoryId: "cat-1",
      }),
    );
  });

  it("uses the page menu item id directly and skips the category lookup", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({
      data: {
        id: "page-2",
        title: "Edit Page",
        menuItemId: "menu-2",
        menuCategoryId: undefined,
      },
    });
    serviceMock.getMenuItems.mockResolvedValueOnce({ data: undefined });

    const { default: EditPageAdminPage } = await import("./page");
    render(
      await EditPageAdminPage({
        params: Promise.resolve({ id: "page-2" }),
      }),
    );

    expect(serviceMock.getMenuCategoryById).not.toHaveBeenCalled();
    expect(pageEditorMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        menuItems: [],
        initialMenuItemId: "menu-2",
        initialCategoryId: undefined,
      }),
    );
  });
});
