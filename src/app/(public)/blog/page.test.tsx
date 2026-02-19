import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
// `@testing-library/jest-dom/vitest` is loaded in test setup to extend `expect`.

const getArticlesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  apiService: {
    getArticles: getArticlesMock,
  },
}));

describe("Blog page", () => {
  beforeEach(() => {
    getArticlesMock.mockReset();
  });

  it("renders heading with no article cards when API returns empty list", async () => {
    getArticlesMock.mockResolvedValueOnce({ data: [] });

    const { default: BlogIndexPage } = await import("./page");
    render(await BlogIndexPage());

    expect(
      screen.getByRole("heading", { name: "Resources" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Read article/i }),
    ).not.toBeInTheDocument();
  });

  it("renders article cards with read links", async () => {
    getArticlesMock.mockResolvedValueOnce({
      data: [
        {
          slug: "weekly-bookkeeping",
          title: "Weekly Bookkeeping Checklist",
          description: "A simple weekly process.",
          category: "Bookkeeping",
          readingMinutes: 6,
          featuredImage: "/images/articles/checklist.webp",
        },
      ],
    });

    const { default: BlogIndexPage } = await import("./page");
    render(await BlogIndexPage());

    expect(
      screen.getByRole("heading", { name: "Resources" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Weekly Bookkeeping Checklist"),
    ).toBeInTheDocument();
    expect(screen.getByText("Bookkeeping")).toBeInTheDocument();
    expect(screen.getByText("6 min read")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Read article/i })).toHaveAttribute(
      "href",
      "/blog/weekly-bookkeeping",
    );
  });
});
