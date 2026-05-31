import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MenuCategoryEditor from "./MenuCategoryEditor";
import { clientApi } from "@/lib/clientApi";

const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
      refresh: routerRefresh,
    }),
  };
});

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    createMenuCategory: vi.fn(),
    updateMenuCategory: vi.fn(),
    deleteMenuCategory: vi.fn(),
  },
}));

describe("MenuCategoryEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a topic without client-side revalidation", async () => {
    vi.mocked(clientApi.updateMenuCategory).mockResolvedValueOnce({} as never);

    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuCategory).toHaveBeenCalledWith(
        "cat-1",
        expect.any(Object),
      );
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("shows a success message after saving", async () => {
    vi.mocked(clientApi.updateMenuCategory).mockResolvedValueOnce({} as never);

    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Topic saved successfully!")).toBeInTheDocument();
    });
  });

  it("shows an error message when the save API call fails", async () => {
    vi.mocked(clientApi.updateMenuCategory).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("creates a new category and redirects in isNew mode", async () => {
    vi.mocked(clientApi.createMenuCategory).mockResolvedValueOnce({
      id: "new-cat-1",
    } as never);

    render(<MenuCategoryEditor menuItemId="menu-1" isNew />);

    // Fill required Title field so native form validation doesn't block submit
    fireEvent.change(screen.getByPlaceholderText(/Small Business Tools/i), {
      target: { value: "Test Topic" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Topic" }));

    await waitFor(() => {
      expect(clientApi.createMenuCategory).toHaveBeenCalledWith(
        expect.objectContaining({ menuItemId: "menu-1" }),
      );
      expect(routerPush).toHaveBeenCalledWith(
        "/cms/menu/categories/new-cat-1/edit",
      );
    });
  });

  it("deletes a category after confirmation and redirects", async () => {
    vi.mocked(clientApi.deleteMenuCategory).mockResolvedValueOnce(
      undefined as never,
    );

    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Topic" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete topic" }));

    await waitFor(() => {
      expect(clientApi.deleteMenuCategory).toHaveBeenCalledWith("cat-1");
      expect(routerPush).toHaveBeenCalledWith("/cms/menu/menu-1/edit");
    });
  });

  it("does not delete when the confirmation dialog is cancelled", async () => {
    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Topic" }));

    expect(clientApi.deleteMenuCategory).not.toHaveBeenCalled();
  });

  it("shows an error message when delete fails", async () => {
    vi.mocked(clientApi.deleteMenuCategory).mockRejectedValueOnce(
      new Error("Delete failed"),
    );

    render(
      <MenuCategoryEditor
        menuItemId="menu-1"
        category={{ id: "cat-1", title: "Templates", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Topic" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete topic" }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });
});
