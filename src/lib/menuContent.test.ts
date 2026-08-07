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

  it("keeps tools on the tools landing page when only one direct page is published", async () => {
    const { getMenuItemLandingHref } = await import("./menuContent");

    expect(
      getMenuItemLandingHref({
        title: "Tools",
        directPages: [{ slug: "csv-profit-calculator-for-etsy" }] as any,
        publishedCategories: [],
      }),
    ).toBe("/pages/tools");
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

  it("excludes categorized pages when hydrating direct pages from the pages endpoint", async () => {
    const { getPublishedMenuItemContent } = await import("./menuContent");

    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "page-1",
          slug: "direct-guide",
          title: "Direct Guide",
          status: "published",
        },
        {
          id: "page-2",
          slug: "topic-guide",
          title: "Topic Guide",
          status: "published",
          menuCategoryId: "cat-1",
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

    expect(result.directPages).toEqual([
      expect.objectContaining({ slug: "direct-guide" }),
    ]);
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

  it("rejects menu-tree failures when complete navigation is required", async () => {
    const { getPublishedMenuItems } = await import("./menuContent");

    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 500,
      error: "Backend unavailable",
    });

    await expect(
      getPublishedMenuItems({ requireComplete: true }),
    ).rejects.toThrow("Unable to load published menu items (HTTP 500)");
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

  it("rejects incomplete page hydration when complete navigation is required", async () => {
    const { getPublishedMenuItemContent } = await import("./menuContent");

    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 503,
      error: "Service unavailable",
    });

    await expect(
      getPublishedMenuItemContent(
        {
          id: "item-1",
          title: "Guides",
          status: "published",
          categories: [],
          pages: [],
        },
        { requireComplete: true },
      ),
    ).rejects.toThrow("Unable to load pages for menu item item-1 (HTTP 503)");
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

  it("returns empty array and logs error when menu layout settings call throws", async () => {
    const { getMenuLayoutOrderIds } = await import("./menuContent");
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    apiServiceMock.getMenuLayoutSettings.mockRejectedValueOnce(
      new Error("timeout"),
    );

    const result = await getMenuLayoutOrderIds("primary");

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("includes published categories with their published pages in getPublishedMenuItemContent", async () => {
    const { getPublishedMenuItemContent } = await import("./menuContent");

    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [],
    });

    const result = await getPublishedMenuItemContent({
      id: "item-1",
      title: "Guides",
      status: "published",
      pages: [],
      categories: [
        {
          id: "cat-1",
          title: "Topic A",
          status: "published",
          pages: [
            { id: "p-1", slug: "page-a", title: "Page A", status: "published" },
            { id: "p-2", slug: "page-b", title: "Page B", status: "draft" },
          ],
        } as any,
        {
          id: "cat-2",
          title: "Topic B",
          status: "draft",
          pages: [
            { id: "p-3", slug: "page-c", title: "Page C", status: "published" },
          ],
        } as any,
      ],
    });

    // Only the published category with at least one published page
    expect(result.publishedCategories).toHaveLength(1);
    expect(result.publishedCategories[0]?.id).toBe("cat-1");
    expect(result.publishedCategories[0]?.publishedPages).toHaveLength(1);
    expect(result.publishedCategories[0]?.publishedPages[0]?.slug).toBe(
      "page-a",
    );
    expect(result.totalPages).toBe(1);
  });

  it("orderMenuItemsByLayout sorts items according to provided ids", async () => {
    const { orderMenuItemsByLayout } = await import("./menuContent");

    const items = [
      { id: "a", title: "A", status: "published" },
      { id: "b", title: "B", status: "published" },
      { id: "c", title: "C", status: "published" },
    ] as any[];

    const result = orderMenuItemsByLayout(items, ["c", "a", "b"]);

    expect(result.map((i: any) => i.id)).toEqual(["c", "a", "b"]);
  });
});
