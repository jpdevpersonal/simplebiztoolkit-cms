import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const apiServiceMock = vi.hoisted(() => ({
  getPublishedMenuItems: vi.fn(),
  getMenuItems: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  apiService: apiServiceMock,
}));

describe("Category page listing", () => {
  beforeEach(() => {
    vi.resetModules();
    apiServiceMock.getPublishedMenuItems.mockReset();
    apiServiceMock.getMenuItems.mockReset();
  });

  it("renders topic pages as shared content cards", async () => {
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

    expect(container.querySelectorAll(".sb-card")).toHaveLength(2);
    expect(container.querySelectorAll(".sb-content-link")).toHaveLength(2);
    expect(container.querySelectorAll(".page-card")).toHaveLength(0);
  });
});
