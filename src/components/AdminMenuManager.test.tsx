import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminMenuManager from "./AdminMenuManager";
import { clientApi } from "../lib/clientApi";
import { revalidateMenuContent } from "../lib/adminRevalidation";

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  useSensor: () => ({}),
  useSensors: (...sensors: unknown[]) => sensors,
  closestCenter: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: (arr: unknown[], from: number, to: number) => {
    const copy = [...arr];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    return copy;
  },
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  }),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => undefined,
    },
  },
}));

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    createMenuItem: vi.fn(),
    updateMenuItem: vi.fn(),
    deleteMenuItem: vi.fn(),
    updateMenuLayoutSettings: vi.fn(),
  },
}));

vi.mock("@/lib/adminRevalidation", () => ({
  revalidateMenuContent: vi.fn(),
}));

describe("AdminMenuManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a new menu item from quick-add panel", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.createMenuItem).mockResolvedValueOnce({
      id: "menu-2",
      title: "Services",
      status: "draft",
    } as never);
    vi.mocked(revalidateMenuContent).mockResolvedValueOnce(undefined as never);

    render(
      <AdminMenuManager
        menuItems={[
          { id: "menu-1", title: "Guides", status: "published" } as any,
        ]}
      />,
    );

    await user.type(screen.getByLabelText("Title *"), "Services");
    await user.click(screen.getByRole("button", { name: "Add Menu Item" }));

    await waitFor(() => {
      expect(clientApi.createMenuItem).toHaveBeenCalledWith({
        title: "Services",
        status: "draft",
      });
      expect(revalidateMenuContent).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Services")).toBeTruthy();
    });
  });

  it("toggles published item to draft when Hide is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateMenuItem).mockResolvedValueOnce({} as never);
    vi.mocked(revalidateMenuContent).mockResolvedValueOnce(undefined as never);

    render(
      <AdminMenuManager
        menuItems={[
          { id: "menu-1", title: "Guides", status: "published" } as any,
        ]}
      />,
    );

    const hideButton = screen
      .getAllByRole("button", { name: "Hide" })
      .find((button) => button.className.includes("admin-btn-action"));

    expect(hideButton).toBeTruthy();
    await user.click(hideButton as HTMLElement);

    await waitFor(() => {
      expect(clientApi.updateMenuItem).toHaveBeenCalledWith("menu-1", {
        title: "Guides",
        description: undefined,
        status: "draft",
      });
      expect(revalidateMenuContent).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Draft")).toBeTruthy();
    });
  });

  it("saves order containing both static nav slots and CMS items", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.createMenuItem).mockResolvedValueOnce({
      id: "menu-2",
      title: "Custom Services",
      status: "draft",
    } as never);
    vi.mocked(clientApi.updateMenuLayoutSettings).mockResolvedValueOnce(
      {} as never,
    );
    vi.mocked(revalidateMenuContent)
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never);

    render(
      <AdminMenuManager
        menuItems={[
          { id: "menu-1", title: "Guides", status: "published" } as any,
        ]}
      />,
    );

    await user.type(screen.getByLabelText("Title *"), "Custom Services");
    await user.click(screen.getByRole("button", { name: "Add Menu Item" }));

    await user.click(screen.getByRole("button", { name: "Save Order" }));

    await waitFor(() => {
      expect(clientApi.updateMenuLayoutSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          menuKey: "primary",
          isActive: true,
          orderedMenuItemIds: expect.arrayContaining([
            "static:/products",
            "static:/faq",
            "menu-1",
            "menu-2",
          ]),
        }),
      );
    });
  });

  it("keeps current order state and shows error when save fails", async () => {
    const user = userEvent.setup();
    const staticSlotError = Object.assign(
      new Error("Bad Request: Invalid menu item id: static:/products"),
      { status: 400 },
    );

    vi.mocked(clientApi.createMenuItem).mockResolvedValueOnce({
      id: "menu-2",
      title: "Services",
      status: "draft",
    } as never);
    vi.mocked(clientApi.updateMenuLayoutSettings).mockRejectedValueOnce(
      staticSlotError as never,
    );
    vi.mocked(revalidateMenuContent).mockResolvedValue(undefined as never);

    render(
      <AdminMenuManager
        menuItems={[
          { id: "menu-1", title: "Guides", status: "published" } as any,
        ]}
      />,
    );

    await user.type(screen.getByLabelText("Title *"), "Services");
    await user.click(screen.getByRole("button", { name: "Add Menu Item" }));

    await user.click(screen.getByRole("button", { name: "Save Order" }));

    await waitFor(() => {
      expect(clientApi.updateMenuLayoutSettings).toHaveBeenCalledTimes(1);
      expect(clientApi.updateMenuLayoutSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          menuKey: "primary",
          orderedMenuItemIds: expect.arrayContaining([
            "static:/products",
            "menu-1",
            "menu-2",
          ]),
        }),
      );
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(
        screen.getByText(/invalid menu item id: static:\/products/i),
      ).toBeTruthy();
    });
  });

  it("soft-deletes and restores a built-in link using persisted hidden tokens", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateMenuLayoutSettings)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce({} as never);
    vi.mocked(revalidateMenuContent)
      .mockResolvedValueOnce(undefined as never)
      .mockResolvedValueOnce(undefined as never);

    render(
      <AdminMenuManager
        menuItems={[
          { id: "menu-1", title: "Guides", status: "published" } as any,
        ]}
      />,
    );

    const templatesRow = screen
      .getByText("Templates")
      .closest(".admin-menu-manager-row") as HTMLElement;
    await user.click(
      within(templatesRow).getByRole("button", { name: "Hide" }),
    );

    await user.click(screen.getByRole("button", { name: "Save Order" }));

    await waitFor(() => {
      expect(clientApi.updateMenuLayoutSettings).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          menuKey: "primary",
          orderedMenuItemIds: expect.arrayContaining([
            "hidden-static:/products",
            "menu-1",
          ]),
        }),
      );
    });

    await user.click(screen.getByRole("button", { name: "Restore Templates" }));
    await user.click(screen.getByRole("button", { name: "Save Order" }));

    await waitFor(() => {
      expect(clientApi.updateMenuLayoutSettings).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          menuKey: "primary",
          orderedMenuItemIds: expect.arrayContaining([
            "static:/products",
            "menu-1",
          ]),
        }),
      );
      expect(
        (
          vi.mocked(clientApi.updateMenuLayoutSettings).mock.calls[1]?.[0] as {
            orderedMenuItemIds?: string[];
          }
        ).orderedMenuItemIds,
      ).not.toContain("hidden-static:/products");
    });
  });
});
