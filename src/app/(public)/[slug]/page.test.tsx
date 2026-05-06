import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiServiceMock = vi.hoisted(() => ({
  getMenuItemPageBySlug: vi.fn(),
  getMenuCategoryById: vi.fn(),
  getMenuItemById: vi.fn(),
  getMenuItemPages: vi.fn(),
}));

const menuContentMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("@/lib/api", () => ({
  apiService: apiServiceMock,
}));

vi.mock("@/lib/menuContent", () => menuContentMock);

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    notFound: notFoundMock,
  };
});

describe("MenuItemPageView", () => {
  beforeEach(() => {
    vi.resetModules();
    apiServiceMock.getMenuItemPageBySlug.mockReset();
    apiServiceMock.getMenuCategoryById.mockReset();
    apiServiceMock.getMenuItemById.mockReset();
    apiServiceMock.getMenuItemPages.mockReset();
    menuContentMock.getPublishedMenuItems.mockReset();
    notFoundMock.mockClear();
  });

  it("shows a link back to the topic page when page data only has a partial topic object", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({
      data: {
        id: "page-1",
        title: "Guide A",
        slug: "guide-a",
        status: "published",
        content: "<p>Guide body</p>",
        menuCategoryId: "cat-1",
        menuCategory: {
          id: "cat-1",
          title: "Topic A",
        },
      },
    });
    apiServiceMock.getMenuCategoryById.mockResolvedValueOnce({
      data: {
        id: "cat-1",
        title: "Topic A",
      },
    });
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([
      {
        id: "menu-1",
        title: "Guides",
        status: "published",
        categories: [
          {
            id: "cat-1",
            title: "Topic A",
            menuItemId: "menu-1",
          },
        ],
      },
    ]);

    const { default: MenuItemPageView } = await import("./page");
    render(
      await MenuItemPageView({
        params: Promise.resolve({ slug: "guide-a" }),
      }),
    );

    expect(screen.getAllByRole("link", { name: "Guides" })[0]).toHaveAttribute(
      "href",
      "/pages/guides",
    );
    expect(screen.getAllByRole("link", { name: "Topic A" })[0]).toHaveAttribute(
      "href",
      "/pages/guides/topic-a",
    );
  });
});
