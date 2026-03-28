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
    revalidateContent: vi.fn(),
  },
}));

describe("MenuCategoryEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates menu content after updating a topic", async () => {
    vi.mocked(clientApi.updateMenuCategory).mockResolvedValueOnce({} as never);
    vi.mocked(clientApi.revalidateContent).mockResolvedValueOnce(
      undefined as never,
    );

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
      expect(clientApi.revalidateContent).toHaveBeenCalledWith("page");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });
});
