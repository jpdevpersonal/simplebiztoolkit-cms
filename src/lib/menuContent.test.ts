import { beforeEach, describe, expect, it, vi } from "vitest";

const apiServiceMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getMenuItems: vi.fn(),
  getMenuItemPages: vi.fn(),
  getMenuLayoutSettings: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiService: apiServiceMock,
}));

describe("menuContent", () => {
  beforeEach(() => {
    vi.resetModules();
    apiServiceMock.getPublishedMenuItems.mockReset();
    apiServiceMock.getMenuItems.mockReset();
    apiServiceMock.getMenuItemPages.mockReset();
    apiServiceMock.getMenuLayoutSettings.mockReset();
  });

  it("falls back to the single-page href when a menu item has one direct page", async () => {
    const { getMenuItemLandingHref } = await import("./menuContent");

    expect(
      getMenuItemLandingHref({
        title: "Guides",
        directPages: [{ slug: "starter-guide" }] as any,
        publishedCategories: [],
      }),
    ).toBe("/starter-guide");
  });

  it("uses the landing page href when a menu item has multiple direct pages", async () => {
    const { getMenuItemLandingHref } = await import("./menuContent");

    expect(
      getMenuItemLandingHref({
        title: "Guides",
        directPages: [{ slug: "one" }, { slug: "two" }] as any,
        publishedCategories: [],
      }),
    ).toBe("/pages/guides");
  });

  it("hydrates direct pages from the pages endpoint when tree data omits them", async () => {
    const { getPublishedMenuItemContent } = await import("./menuContent");

    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "page-1",
          slug: "guide-a",
          title: "Guide A",
          status: "published",
        },
        {
          id: "page-2",
          slug: "guide-b",
          title: "Guide B",
          status: "draft",
        },
      ],
    });

    const result = await getPublishedMenuItemContent({
      id: "item-1",
      title: "Guides",
      status: "published",
      categories: [],
      pages: [],
    });

    expect(apiServiceMock.getMenuItemPages).toHaveBeenCalledWith(
      undefined,
      "published",
      "item-1",
    );
    expect(result.directPages).toHaveLength(1);
    expect(result.directPages[0]?.slug).toBe("guide-a");
    expect(result.totalPages).toBe(1);
  });

  it("filters to published menu items when loading the menu tree", async () => {
    const { getPublishedMenuItems } = await import("./menuContent");

    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        { id: "item-1", title: "Published", status: "published" },
        { id: "item-2", title: "Draft", status: "draft" },
      ],
    });

    const result = await getPublishedMenuItems();

    expect(result).toEqual([
      { id: "item-1", title: "Published", status: "published" },
    ]);
  });

  it("falls back to getMenuItems when published endpoint returns 404", async () => {
    const { getPublishedMenuItems } = await import("./menuContent");

    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 404,
      data: null,
    });
    apiServiceMock.getMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        { id: "item-1", title: "Published", status: "published" },
        { id: "item-2", title: "Draft", status: "draft" },
      ],
    });

    const result = await getPublishedMenuItems();

    expect(apiServiceMock.getMenuItems).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: "item-1", title: "Published", status: "published" },
    ]);
  });

  it("returns slug landing href when a menu item has published categories", async () => {
    const { getMenuItemLandingHref } = await import("./menuContent");

    expect(
      getMenuItemLandingHref({
        title: "How To Guides",
        directPages: [{ slug: "one" }] as any,
        publishedCategories: [{ id: "cat-1" }] as any,
      }),
    ).toBe("/pages/how-to-guides");
  });

  it("keeps direct pages empty when page hydration throws", async () => {
    const { getPublishedMenuItemContent } = await import("./menuContent");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    apiServiceMock.getMenuItemPages.mockRejectedValueOnce(
      new Error("network failed"),
    );

    const result = await getPublishedMenuItemContent({
      id: "item-1",
      title: "Guides",
      status: "published",
      categories: [],
      pages: [],
    });

    expect(result.directPages).toEqual([]);
    expect(result.totalPages).toBe(0);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("orders published menu items using persisted layout ids", async () => {
    const { getOrderedPublishedMenuItems } = await import("./menuContent");

    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        { id: "menu-1", title: "One", status: "published" },
        { id: "menu-2", title: "Two", status: "published" },
        { id: "menu-3", title: "Three", status: "published" },
      ],
    });
    apiServiceMock.getMenuLayoutSettings.mockResolvedValueOnce({
      statusCode: 200,
      data: {
        menuKey: "primary",
        orderedMenuItemIds: ["menu-3", "menu-1"],
      },
    });

    const result = await getOrderedPublishedMenuItems();

    expect(result.map((item) => item.id)).toEqual([
      "menu-3",
      "menu-1",
      "menu-2",
    ]);
  });

  it("falls back to published menu order when layout endpoint is unavailable", async () => {
    const { getOrderedPublishedMenuItems } = await import("./menuContent");

    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        { id: "menu-1", title: "One", status: "published" },
        { id: "menu-2", title: "Two", status: "published" },
      ],
    });
    apiServiceMock.getMenuLayoutSettings.mockResolvedValueOnce({
      statusCode: 404,
      data: null,
    });

    const result = await getOrderedPublishedMenuItems();

    expect(result.map((item) => item.id)).toEqual(["menu-1", "menu-2"]);
  });
});
