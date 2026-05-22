import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiServiceMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getMenuItems: vi.fn(),
}));

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    notFound: notFoundMock,
  };
});

vi.mock("@/lib/api", () => ({
  apiService: apiServiceMock,
}));

const publishedGuides = {
  statusCode: 200,
  data: [
    {
      id: "guides",
      title: "Guides",
      status: "published",
      categories: [
        {
          id: "topic-1",
          title: "Topic A",
          status: "published",
          pages: [
            {
              id: "page-1",
              slug: "guide-a",
              title: "Guide A",
              description: "First page",
              dateISO: "2026-03-01",
              status: "published",
            },
            {
              id: "page-2",
              slug: "guide-b",
              title: "Guide B",
              description: "Second page",
              dateISO: "2026-03-02",
              status: "published",
            },
          ],
        },
      ],
    },
  ],
};

describe("Category page listing", () => {
  beforeEach(() => {
    vi.resetModules();
    apiServiceMock.getPublishedMenuItems.mockReset();
    apiServiceMock.getMenuItems.mockReset();
    notFoundMock.mockClear();
  });

  it("renders topic pages as shared content cards", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce(publishedGuides);

    const { default: CategoryPageListing } = await import("./page");
    const { container } = render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    expect(container.querySelectorAll(".sb-card")).toHaveLength(2);
    expect(container.querySelectorAll(".sb-content-link")).toHaveLength(2);
    expect(container.querySelectorAll(".page-card")).toHaveLength(0);
  });

  it("falls back to a valid header image when a featured image is a local file path", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "topic-1",
              title: "Topic A",
              status: "published",
              pages: [
                {
                  id: "page-1",
                  slug: "guide-a",
                  title: "Guide A",
                  description: "First page",
                  dateISO: "2026-03-01",
                  status: "published",
                  featuredImage:
                    "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
                  headerImage: "/images/category-safe.webp",
                },
              ],
            },
          ],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");
    const { container } = render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    const image = container.querySelector("img");
    expect(image).toHaveAttribute("src", "/images/category-safe.webp");
  });

  it("calls notFound when the menu item slug does not match any item", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");

    await expect(
      CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "nonexistent",
          categorySlug: "topic-a",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("calls notFound when the category slug does not match any category", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "topic-1",
              title: "Topic A",
              status: "published",
              pages: [],
            },
          ],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");

    await expect(
      CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "nonexistent",
        }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to getMenuItems when getPublishedMenuItems returns 404", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 404,
      data: null,
    });
    apiServiceMock.getMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "topic-1",
              title: "Topic A",
              status: "published",
              pages: [
                {
                  id: "page-1",
                  slug: "guide-a",
                  title: "Guide A",
                  status: "published",
                },
              ],
            },
          ],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");
    const { container } = render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    expect(container.querySelectorAll(".sb-card")).toHaveLength(1);
    expect(apiServiceMock.getMenuItems).toHaveBeenCalled();
  });

  it("shows the empty state when there are no published pages", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "topic-1",
              title: "Topic A",
              status: "published",
              pages: [],
            },
          ],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");
    render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    expect(screen.getByText("No pages available yet")).toBeInTheDocument();
    expect(
      screen.getByText("Check back soon for new content in this topic."),
    ).toBeInTheDocument();
  });

  it("renders the formatted date for pages that have a dateISO value", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce(publishedGuides);

    const { default: CategoryPageListing } = await import("./page");
    render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    // "2026-03-01" should be formatted as "Mar 1, 2026"
    expect(screen.getByText("Mar 1, 2026")).toBeInTheDocument();
  });

  it("renders a featured image for pages that have one", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "guides",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "topic-1",
              title: "Topic A",
              status: "published",
              pages: [
                {
                  id: "page-1",
                  slug: "guide-a",
                  title: "Guide A",
                  status: "published",
                  featuredImage: "/images/guide-a.webp",
                },
              ],
            },
          ],
        },
      ],
    });

    const { default: CategoryPageListing } = await import("./page");
    const { container } = render(
      await CategoryPageListing({
        params: Promise.resolve({
          menuItemSlug: "guides",
          categorySlug: "topic-a",
        }),
      }),
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute("src", "/images/guide-a.webp");
    expect(img).toHaveAttribute("alt", "Guide A");
  });

  it("generates static params from published menu items and categories", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce(publishedGuides);

    const { generateStaticParams } = await import("./page");
    const params = await generateStaticParams();

    expect(params).toContainEqual({
      menuItemSlug: "guides",
      categorySlug: "topic-a",
    });
  });

  it("returns empty metadata when the page cannot be resolved", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [],
    });

    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({
        menuItemSlug: "nonexistent",
        categorySlug: "topic-a",
      }),
    });

    expect(metadata).toEqual({});
  });

  it("returns category metadata when the page resolves successfully", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce(publishedGuides);

    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({
        menuItemSlug: "guides",
        categorySlug: "topic-a",
      }),
    });

    expect(metadata.title).toContain("Topic A");
  });
});
