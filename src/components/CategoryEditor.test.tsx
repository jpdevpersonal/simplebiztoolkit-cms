import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CategoryEditor from "./CategoryEditor";
import { clientApi } from "@/lib/clientApi";

const routerPush = vi.fn();
const routerRefresh = vi.fn();
const routerBack = vi.fn();

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<any>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      push: routerPush,
      refresh: routerRefresh,
      back: routerBack,
    }),
  };
});

vi.mock("@/lib/clientApi", () => ({
  clientApi: {
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

describe("CategoryEditor", () => {
  const category = {
    id: "cat-1",
    slug: "general",
    name: "General",
    summary: "Summary",
    howThisHelps: "Helps",
    heroImage: "hero.jpg",
    items: [],
  };

  it("saves category changes", async () => {
    vi.mocked(clientApi.updateCategory).mockResolvedValueOnce(category as any);

    const { container } = render(<CategoryEditor category={category as any} />);
    const inputs = container.querySelectorAll("input.form-control");
    fireEvent.change(inputs[0], { target: { value: "Updated General" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(clientApi.updateCategory).toHaveBeenCalledWith(
        "cat-1",
        expect.objectContaining({ name: "Updated General" }),
      );
      expect(routerRefresh).toHaveBeenCalled();
      expect(
        screen.getByText("Category saved successfully!"),
      ).toBeInTheDocument();
    });
  });

  it("deletes category after confirmation", async () => {
    vi.mocked(clientApi.deleteCategory).mockResolvedValueOnce(undefined as any);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(<CategoryEditor category={category as any} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete Category" }));

    await waitFor(() => {
      expect(clientApi.deleteCategory).toHaveBeenCalledWith("cat-1");
      expect(routerPush).toHaveBeenCalledWith("/admin/categories");
    });
  });
});
