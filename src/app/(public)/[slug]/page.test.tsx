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
  getPublishedMenuItemContent: vi.fn(),
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
    menuContentMock.getPublishedMenuItemContent.mockReset();
    notFoundMock.mockClear();
  });

  it("generates static params for published CMS pages only", async () => {
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      data: [
        { id: "page-1", slug: "published-guide", status: "published" },
        { id: "page-2", slug: "draft-guide", status: "draft" },
      ],
    });

    const { generateStaticParams } = await import("./page");

    await expect(generateStaticParams()).resolves.toEqual([
      { slug: "published-guide" },
    ]);
  });

  it("returns no static params when the API response has no page data", async () => {
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({ data: null });

    const { generateStaticParams } = await import("./page");

    await expect(generateStaticParams()).resolves.toEqual([]);
  });

  it("generates metadata from the CMS page SEO fields", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({
      data: {
        id: "page-meta",
        title: "Fallback Title",
        slug: "metadata-guide",
        status: "published",
        seoTitle: "SEO Title",
        description: "Fallback description",
        seoDescription: "SEO description",
        canonicalUrl: "https://example.com/metadata-guide",
        featuredImage: "/images/featured.webp",
      },
    });

    const { generateMetadata } = await import("./page");

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "metadata-guide" }),
    });

    expect(metadata.title).toBe("SEO Title");
    expect(metadata.description).toBe("SEO description");
    expect(metadata.alternates).toEqual({
      canonical: "https://example.com/metadata-guide",
    });
    expect(metadata.openGraph).toMatchObject({
      title: "SEO Title",
      description: "SEO description",
      type: "website",
      url: "/metadata-guide",
      images: [
        {
          url: "/images/featured.webp",
        },
      ],
    });
  });

  it("returns empty metadata when a CMS page is missing", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({ data: null });

    const { generateMetadata } = await import("./page");

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toEqual({});
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

  it("resolves parent menu item directly via page.menuItemId when not inline", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({
      data: {
        id: "page-2",
        title: "Guide B",
        slug: "guide-b",
        status: "published",
        content: "<p>Body</p>",
        menuItemId: "menu-1",
        // No inline menuItem or menuCategory
      },
    });
    apiServiceMock.getMenuItemById.mockResolvedValueOnce({
      data: { id: "menu-1", title: "Guides" },
    });
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([
      { id: "menu-1", title: "Guides", status: "published", categories: [] },
    ]);
    // Two direct pages → not a standalone single-page menu item
    menuContentMock.getPublishedMenuItemContent.mockResolvedValueOnce({
      publishedCategories: [],
      directPages: [
        { id: "page-2", slug: "guide-b" },
        { id: "page-3", slug: "guide-c" },
      ],
    });

    const { default: MenuItemPageView } = await import("./page");
    render(
      await MenuItemPageView({
        params: Promise.resolve({ slug: "guide-b" }),
      }),
    );

    expect(screen.getAllByRole("link", { name: "Guides" })[0]).toHaveAttribute(
      "href",
      "/pages/guides",
    );
  });

  it("includes the parent category in the breadcrumb when category has a menuItemId", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({
      data: {
        id: "page-3",
        title: "Sub Guide",
        slug: "sub-guide",
        status: "published",
        content: "<p>Sub body</p>",
        menuCategoryId: "cat-2",
        menuCategory: {
          id: "cat-2",
          title: "Category B",
          menuItemId: "menu-2",
          menuItem: { id: "menu-2", title: "Resources" },
        },
      },
    });
    // getMenuCategoryById NOT called because menuCategory.menuItemId is set
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([]);

    const { default: MenuItemPageView } = await import("./page");
    render(
      await MenuItemPageView({
        params: Promise.resolve({ slug: "sub-guide" }),
      }),
    );

    expect(
      screen.getAllByRole("link", { name: "Resources" })[0],
    ).toHaveAttribute("href", "/pages/resources");
    expect(
      screen.getAllByRole("link", { name: "Category B" })[0],
    ).toHaveAttribute("href", "/pages/resources/category-b");
  });

  it("fetches parent menu item via parentCategory.menuItemId when no inline menuItem", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({
      data: {
        id: "page-4",
        title: "Deep Page",
        slug: "deep-page",
        status: "published",
        content: "<p>Content</p>",
        menuCategoryId: "cat-3",
        menuCategory: {
          id: "cat-3",
          title: "Sub Topic",
          menuItemId: "menu-3",
          // No inline menuItem — forces lines 101-104 fetch
        },
      },
    });
    apiServiceMock.getMenuCategoryById.mockResolvedValueOnce({
      data: { id: "cat-3", title: "Sub Topic", menuItemId: "menu-3" },
    });
    apiServiceMock.getMenuItemById.mockResolvedValueOnce({
      data: { id: "menu-3", title: "Parent Menu" },
    });
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([]);

    const { default: MenuItemPageView } = await import("./page");
    render(
      await MenuItemPageView({
        params: Promise.resolve({ slug: "deep-page" }),
      }),
    );

    expect(
      screen.getAllByRole("link", { name: "Parent Menu" })[0],
    ).toHaveAttribute("href", "/pages/parent-menu");
    expect(
      screen.getAllByRole("link", { name: "Sub Topic" })[0],
    ).toHaveAttribute("href", "/pages/parent-menu/sub-topic");
  });

  it("calls notFound when page data is not returned", async () => {
    apiServiceMock.getMenuItemPageBySlug.mockResolvedValueOnce({ data: null });

    const { default: MenuItemPageView } = await import("./page");

    await expect(
      MenuItemPageView({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
