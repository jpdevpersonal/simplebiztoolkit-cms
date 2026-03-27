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
    revalidateContent: vi.fn(),
  },
}));

describe("MenuItemEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates menu content after updating a menu item", async () => {
    vi.mocked(clientApi.updateMenuItem).mockResolvedValueOnce({} as never);
    vi.mocked(clientApi.revalidateContent).mockResolvedValueOnce(
      undefined as never,
    );

    render(
      <MenuItemEditor
        menuItem={{ id: "menu-1", title: "Resources", status: "draft" } as any}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateMenuItem).toHaveBeenCalledWith(
        "menu-1",
        expect.any(Object),
      );
      expect(clientApi.revalidateContent).toHaveBeenCalledWith("page");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });
});
