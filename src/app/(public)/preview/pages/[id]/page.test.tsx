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
});
