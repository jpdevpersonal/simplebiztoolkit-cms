import { render, screen } from "@testing-library/react";
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

  it("renders direct pages as article cards when topics exist", async () => {
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

    expect(screen.getByText("Other Pages")).toBeInTheDocument();
    expect(container.querySelectorAll(".page-card")).toHaveLength(1);
    expect(container.querySelectorAll(".sb-card")).toHaveLength(1);
    expect(container.querySelectorAll(".sb-content-link")).toHaveLength(1);
  });

  it("renders the menu item description when populated", async () => {
    menuContentMock.getPublishedMenuItems.mockResolvedValueOnce([
      {
        id: "articles",
        title: "Articles",
        description:
          "<p><strong>Expert guidance</strong> for running a better small business.</p>",
        status: "published",
      },
    ]);
    menuContentMock.getPublishedMenuItemContent.mockResolvedValueOnce({
      id: "articles",
      title: "Articles",
      description:
        "<p><strong>Expert guidance</strong> for running a better small business.</p>",
      status: "published",
      publishedCategories: [],
      directPages: [
        {
          id: "page-1",
          slug: "how-to-budget",
          title: "How to Budget",
          description: "Budgeting basics",
          status: "published",
        },
      ],
      totalPages: 1,
    });

    const { default: MenuItemLandingPage } = await import("./page");
    render(
      await MenuItemLandingPage({
        params: Promise.resolve({ menuItemSlug: "articles" }),
      }),
    );

    expect(
      screen.getByText("Expert guidance", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("Expert guidance").tagName).toBe("STRONG");
  });

  it("falls back to a valid header image when a featured image is a local file path", async () => {
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
          featuredImage:
            "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
          headerImage: "/images/safe-guide.webp",
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

    const images = container.querySelectorAll("img");
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute("src", "/images/safe-guide.webp");
  });
});
