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
});
