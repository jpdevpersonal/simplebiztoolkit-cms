import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    createCategory: vi.fn(),
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
    const user = userEvent.setup();
    vi.mocked(clientApi.updateCategory).mockResolvedValueOnce(category as any);

    const { container } = render(<CategoryEditor category={category as any} />);
    const nameInput = container.querySelectorAll(
      "input.form-control",
    )[0] as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "Updated General");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

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

  it("shows error message when save fails", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.updateCategory).mockRejectedValueOnce(
      new Error("Server error"),
    );

    render(<CategoryEditor category={category as any} />);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("deletes category after confirmation", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.deleteCategory).mockResolvedValueOnce(undefined as any);
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(<CategoryEditor category={category as any} />);
    await user.click(screen.getByRole("button", { name: "Delete Category" }));

    await waitFor(() => {
      expect(clientApi.deleteCategory).toHaveBeenCalledWith("cat-1");
      expect(routerPush).toHaveBeenCalledWith("/cms/categories");
    });
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );

    render(<CategoryEditor category={category as any} />);
    await user.click(screen.getByRole("button", { name: "Delete Category" }));

    await waitFor(() => {
      expect(clientApi.deleteCategory).not.toHaveBeenCalled();
    });
  });

  it("shows error message when delete fails", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.deleteCategory).mockRejectedValueOnce(
      new Error("Delete error"),
    );
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );

    render(<CategoryEditor category={category as any} />);
    await user.click(screen.getByRole("button", { name: "Delete Category" }));

    await waitFor(() => {
      expect(screen.getByText("Delete error")).toBeInTheDocument();
    });
  });

  it("creates a new category and navigates to the list in isNew mode", async () => {
    const user = userEvent.setup();
    vi.mocked(clientApi.createCategory).mockResolvedValueOnce({
      ...category,
      id: "cat-new",
    } as any);

    render(<CategoryEditor isNew />);

    // Fill required fields so native form validation doesn't block submit
    const textboxes = screen.getAllByRole("textbox");
    await user.type(textboxes[0], "Test Category"); // Name
    await user.type(textboxes[1], "test-category"); // Slug

    await user.click(screen.getByRole("button", { name: "Create Category" }));

    await waitFor(() => {
      expect(clientApi.createCategory).toHaveBeenCalled();
      expect(routerPush).toHaveBeenCalledWith("/cms/categories");
      expect(routerRefresh).toHaveBeenCalled();
    });
  });

  it("navigates back when Cancel is clicked", async () => {
    const user = userEvent.setup();

    render(<CategoryEditor category={category as any} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(routerBack).toHaveBeenCalled();
  });

  it("does not show the Delete button in isNew mode", () => {
    render(<CategoryEditor isNew />);

    expect(
      screen.queryByRole("button", { name: "Delete Category" }),
    ).not.toBeInTheDocument();
  });
});
