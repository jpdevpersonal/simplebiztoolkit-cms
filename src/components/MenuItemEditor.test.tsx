import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MenuItemEditor from "./MenuItemEditor";
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

vi.mock("@/components/RichContentField", () => ({
  __esModule: true,
  default: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
  },
}));

describe("MenuItemEditor", () => {
  beforeEach(() => {
    // Guard against fake timers leaked by other suites when running full CI.
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("updates a menu item without client-side revalidation", async () => {
    vi.mocked(clientApi.updateMenuItem).mockResolvedValueOnce({} as never);

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuItem).toHaveBeenCalledWith(
        "menu-1",
        expect.any(Object),
      );
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("shows a success message after saving", async () => {
    vi.mocked(clientApi.updateMenuItem).mockResolvedValueOnce({} as never);

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(
        screen.getByText("Menu item saved successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("shows an error message when the save API call fails", async () => {
    vi.mocked(clientApi.updateMenuItem).mockRejectedValueOnce(
      new Error("Save failed"),
    );

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument();
    });
  });

  it("creates a new menu item and redirects in isNew mode", async () => {
    vi.mocked(clientApi.createMenuItem).mockResolvedValueOnce({
      id: "new-menu-1",
    } as never);

    render(<MenuItemEditor isNew />);

    // Fill required Title field so native form validation doesn't block submit
    fireEvent.change(screen.getByPlaceholderText(/Products, Guides/i), {
      target: { value: "Test Menu Item" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create Menu Item" }));

    await waitFor(() => {
      expect(clientApi.createMenuItem).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Test Menu Item" }),
      );
      expect(routerPush).toHaveBeenCalledWith("/cms/menu/new-menu-1/edit");
    });
  });

  it("deletes a menu item after confirmation and redirects", async () => {
    vi.mocked(clientApi.deleteMenuItem).mockResolvedValueOnce(
      undefined as never,
    );

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Menu Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete menu item" }));

    await waitFor(() => {
      expect(clientApi.deleteMenuItem).toHaveBeenCalledWith("menu-1");
      expect(routerPush).toHaveBeenCalledWith("/cms/menu");
    });
  });

  it("does not delete when the confirmation dialog is cancelled", async () => {
    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Menu Item" }));

    expect(clientApi.deleteMenuItem).not.toHaveBeenCalled();
  });

  it("shows an error message when delete fails", async () => {
    vi.mocked(clientApi.deleteMenuItem).mockRejectedValueOnce(
      new Error("Delete failed"),
    );

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Guides", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete Menu Item" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete menu item" }));

    await waitFor(() => {
      expect(screen.getByText("Delete failed")).toBeInTheDocument();
    });
  });
});
