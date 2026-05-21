import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiServiceMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getMenuItems: vi.fn(),
  getMenuItemPages: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiService: apiServiceMock,
}));

describe("Pages overview", () => {
  beforeEach(() => {
    vi.resetModules();
    apiServiceMock.getPublishedMenuItems.mockReset();
    apiServiceMock.getMenuItems.mockReset();
    apiServiceMock.getMenuItemPages.mockReset();
  });

  it("links straight to a page when a menu item has one direct page and to a grid when it has many", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "item-1",
          title: "Guides",
          description: "Single page menu item",
          status: "published",
          categories: [],
          pages: [],
        },
        {
          id: "item-2",
          title: "Tutorials",
          description: "Multi-page menu item",
          status: "published",
          categories: [],
          pages: [],
        },
      ],
    });
    apiServiceMock.getMenuItemPages
      .mockResolvedValueOnce({
        statusCode: 200,
        data: [
          {
            id: "page-1",
            slug: "starter-guide",
            title: "Starter Guide",
            status: "published",
          },
        ],
      })
      .mockResolvedValueOnce({
        statusCode: 200,
        data: [
          {
            id: "page-2",
            slug: "tutorial-a",
            title: "Tutorial A",
            status: "published",
          },
          {
            id: "page-3",
            slug: "tutorial-b",
            title: "Tutorial B",
            status: "published",
          },
        ],
      });

    const { default: PagesOverview } = await import("./page");
    render(await PagesOverview());

    expect(screen.getByRole("link", { name: /Guides/i })).toHaveAttribute(
      "href",
      "/starter-guide",
    );
    expect(screen.getByRole("link", { name: /Tutorials/i })).toHaveAttribute(
      "href",
      "/pages/tutorials",
    );
  });

  it("renders the item description when present", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "item-1",
          title: "Guides",
          description: "Helpful articles for small businesses",
          status: "published",
          categories: [],
          pages: [],
        },
      ],
    });
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "page-1",
          slug: "starter-guide",
          title: "Starter Guide",
          status: "published",
        },
      ],
    });

    const { default: PagesOverview } = await import("./page");
    render(await PagesOverview());

    expect(
      screen.getByText("Helpful articles for small businesses"),
    ).toBeInTheDocument();
  });

  it("shows the topic count when a menu item has published categories", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "item-1",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "cat-1",
              title: "Topic A",
              status: "published",
              pages: [{ id: "p-1", slug: "page-a", status: "published" }],
            },
            {
              id: "cat-2",
              title: "Topic B",
              status: "published",
              pages: [{ id: "p-2", slug: "page-b", status: "published" }],
            },
          ],
          pages: [],
        },
      ],
    });
    // getMenuItemPages not called since categories provide pages
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [],
    });

    const { default: PagesOverview } = await import("./page");
    render(await PagesOverview());

    expect(screen.getByText(/2 topics/i)).toBeInTheDocument();
  });

  it("shows singular 'topic' label when item has exactly 1 published category", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "item-1",
          title: "Guides",
          status: "published",
          categories: [
            {
              id: "cat-1",
              title: "Topic A",
              status: "published",
              pages: [{ id: "p-1", slug: "page-a", status: "published" }],
            },
          ],
          pages: [],
        },
      ],
    });
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [],
    });

    const { default: PagesOverview } = await import("./page");
    render(await PagesOverview());

    expect(screen.getByText(/1 topic$/i)).toBeInTheDocument();
  });

  it("does not render description when absent", async () => {
    apiServiceMock.getPublishedMenuItems.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "item-1",
          title: "Guides No Desc",
          status: "published",
          categories: [],
          pages: [],
          // No description field
        },
      ],
    });
    apiServiceMock.getMenuItemPages.mockResolvedValueOnce({
      statusCode: 200,
      data: [
        {
          id: "page-1",
          slug: "starter-guide",
          title: "Starter Guide",
          status: "published",
        },
      ],
    });

    const { default: PagesOverview } = await import("./page");
    const { container } = render(await PagesOverview());

    // No description paragraph should appear in the article card
    const card = container.querySelector(".page-card");
    expect(card?.querySelector(".page-card-summary")).not.toBeInTheDocument();
  });
});
