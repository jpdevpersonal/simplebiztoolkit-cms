import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMock = vi.hoisted(() => ({
  getMenuItemPageById: vi.fn(),
  getMenuItemById: vi.fn(),
  getMenuCategoryById: vi.fn(),
}));

const redirectMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
);

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    redirect: redirectMock,
    notFound: notFoundMock,
  };
});

vi.mock("@/app/admin/_lib/getAdminApiService", () => ({
  getAdminApiService: vi.fn(async () => ({
    service: serviceMock,
    session: { user: { email: "admin@example.com" } },
  })),
}));

describe("PagePreview", () => {
  beforeEach(() => {
    vi.resetModules();
    serviceMock.getMenuItemPageById.mockReset();
    serviceMock.getMenuItemById.mockReset();
    serviceMock.getMenuCategoryById.mockReset();
    redirectMock.mockClear();
    notFoundMock.mockClear();
  });

  it("renders a saved draft page using the admin page endpoint", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({
      data: {
        id: "page-1",
        title: "Draft Page",
        slug: "draft-page",
        status: "draft",
        content: "<p>Draft body</p>",
        menuItemId: "menu-1",
      },
    });
    serviceMock.getMenuItemById.mockResolvedValueOnce({
      data: { id: "menu-1", title: "Guides" },
    });

    const { default: PagePreview } = await import("./page");
    render(
      await PagePreview({
        params: Promise.resolve({ id: "page-1" }),
      }),
    );

    expect(serviceMock.getMenuItemPageById).toHaveBeenCalledWith("page-1");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Previewing saved draft page.",
    );
    expect(screen.getByText("Draft body")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Guides" })).toHaveAttribute(
      "href",
      "/pages/guides",
    );
    expect(
      screen.getByRole("heading", { name: "Draft Page" }),
    ).toBeInTheDocument();
  });

  it("omits invalid local file paths from preview header images", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({
      data: {
        id: "page-2",
        title: "SEO Guide",
        slug: "seo-guide",
        status: "published",
        content: "<p>Guide body</p>",
        headerImage:
          "c:\\Users\\Admin\\Documents\\Read Now\\SEO and Generative-SEO Playbook for Simple Biz Toolkit.pdf",
      },
    });

    const { default: PagePreview } = await import("./page");
    const { container } = render(
      await PagePreview({
        params: Promise.resolve({ id: "page-2" }),
      }),
    );

    expect(container.querySelector("img")).toBeNull();
  });

  it("redirects to login when session is not present", async () => {
    const { getAdminApiService } =
      await import("@/app/admin/_lib/getAdminApiService");
    (getAdminApiService as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      service: serviceMock,
      session: null,
    });

    const { default: PagePreview } = await import("./page");

    await expect(
      PagePreview({ params: Promise.resolve({ id: "page-1" }) }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/cms/login");
  });

  it("calls notFound when page data is not returned", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({ data: null });

    const { default: PagePreview } = await import("./page");

    await expect(
      PagePreview({ params: Promise.resolve({ id: "missing" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("resolves parent menu item via menuCategoryId when not inline", async () => {
    serviceMock.getMenuItemPageById.mockResolvedValueOnce({
      data: {
        id: "page-3",
        title: "Category Guide",
        slug: "category-guide",
        status: "published",
        content: "<p>Body</p>",
        menuCategoryId: "cat-1",
        // No inline menuItem or menuCategory
      },
    });
    serviceMock.getMenuCategoryById.mockResolvedValueOnce({
      data: { id: "cat-1", menuItemId: "menu-1" },
    });
    serviceMock.getMenuItemById.mockResolvedValueOnce({
      data: { id: "menu-1", title: "Resources" },
    });

    const { default: PagePreview } = await import("./page");
    render(
      await PagePreview({
        params: Promise.resolve({ id: "page-3" }),
      }),
    );

    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute(
      "href",
      "/pages/resources",
    );
  });
});
