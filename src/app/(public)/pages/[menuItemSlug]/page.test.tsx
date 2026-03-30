import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const menuContentMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getPublishedMenuItemContent: vi.fn(),
}));

vi.mock("@/lib/menuContent", () => menuContentMock);

describe("Menu item landing page", () => {
  beforeEach(() => {
    vi.resetModules();
    menuContentMock.getPublishedMenuItems.mockReset();
    menuContentMock.getPublishedMenuItemContent.mockReset();
  });

  it("uses shared content cards for multiple direct pages without topics", async () => {
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([
      {
        id: "guides",
        title: "Guides",
        status: "published",
      },
    ]);
    menuContentMock.getPublishedMenuItemContent.mockResolvedValueOnce({
      id: "guides",
      title: "Guides",
      status: "published",
      publishedCategories: [],
      directPages: [
        {
          id: "page-1",
          slug: "guide-a",
          title: "Guide A",
          description: "First page",
          status: "published",
          dateISO: "2026-03-01",
        },
        {
          id: "page-2",
          slug: "guide-b",
          title: "Guide B",
          description: "Second page",
          status: "published",
          dateISO: "2026-03-02",
        },
      ],
      totalPages: 2,
    });

    const { default: MenuItemLandingPage } = await import("./page");
    const { container } = render(
      await MenuItemLandingPage({
        params: Promise.resolve({ menuItemSlug: "guides" }),
      }),
    );

    expect(container.querySelectorAll(".sb-card")).toHaveLength(2);
    expect(container.querySelectorAll(".page-card")).toHaveLength(0);
    expect(container.querySelectorAll(".sb-content-link")).toHaveLength(2);
  });

  it("keeps the existing page grid when topics exist", async () => {
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([
      {
        id: "guides",
        title: "Guides",
        status: "published",
      },
    ]);
    menuContentMock.getPublishedMenuItemContent.mockResolvedValueOnce({
      id: "guides",
      title: "Guides",
      status: "published",
      publishedCategories: [
        {
          id: "topic-1",
          title: "Topic A",
          publishedPages: [
            {
              id: "page-1",
              slug: "guide-a",
              title: "Guide A",
              status: "published",
            },
          ],
        },
      ],
      directPages: [
        {
          id: "page-2",
          slug: "guide-b",
          title: "Guide B",
          description: "Direct page",
          status: "published",
        },
      ],
      totalPages: 2,
    });

    const { default: MenuItemLandingPage } = await import("./page");
    const { container } = render(
      await MenuItemLandingPage({
        params: Promise.resolve({ menuItemSlug: "guides" }),
      }),
    );

    expect(container.querySelectorAll(".page-card").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".sb-content-link")).toHaveLength(0);
  });
});
