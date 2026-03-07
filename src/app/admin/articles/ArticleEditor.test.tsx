import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArticleEditor from "./ArticleEditor";
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
    createArticle: vi.fn(),
    updateArticle: vi.fn(),
    revalidateContent: vi.fn(),
  },
}));

const existingArticle = {
  id: "art-1",
  slug: "my-article",
  title: "My Article",
  subtitle: "A subtitle",
  description: "A description",
  content: "<p>Content</p>",
  dateISO: "2026-01-01",
  category: "Bookkeeping",
  readingMinutes: 5,
  badges: ["Tag"],
  status: "draft" as const,
};

describe("ArticleEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create mode (isNew=true)", () => {
    it("renders the Create Article button", () => {
      render(<ArticleEditor isNew />);
      expect(
        screen.getByRole("button", { name: "Create Article" }),
      ).toBeTruthy();
    });

    it("renders Title and Slug inputs", () => {
      render(<ArticleEditor isNew />);
      // Check the field labels are present
      expect(screen.getByText(/^Title \*$/)).toBeTruthy();
      expect(screen.getByText(/^Slug \*$/)).toBeTruthy();
    });

    it("renders the Cancel button", () => {
      render(<ArticleEditor isNew />);
      expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
    });

    it("creates an article and redirects on submit", async () => {
      vi.mocked(clientApi.createArticle).mockResolvedValueOnce(
        existingArticle as any,
      );
      vi.mocked(clientApi.revalidateContent).mockResolvedValueOnce(
        undefined as any,
      );

      const { container } = render(<ArticleEditor isNew />);

      // Submit the form directly to bypass HTML5 required-field validation
      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(clientApi.createArticle).toHaveBeenCalled();
        expect(routerPush).toHaveBeenCalledWith("/admin/articles");
        expect(routerRefresh).toHaveBeenCalled();
      });
    });

    it("shows an error message when creation fails", async () => {
      vi.mocked(clientApi.createArticle).mockRejectedValueOnce(
        new Error("Server error"),
      );

      const { container } = render(<ArticleEditor isNew />);

      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText("Server error")).toBeTruthy();
      });
    });
  });

  describe("edit mode (isNew=false)", () => {
    it("renders the Save Changes button", () => {
      render(<ArticleEditor article={existingArticle} />);
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeTruthy();
    });

    it("pre-populates the title field", () => {
      render(<ArticleEditor article={existingArticle} />);
      expect(screen.getByDisplayValue("My Article")).toBeTruthy();
    });

    it("pre-populates the slug field", () => {
      render(<ArticleEditor article={existingArticle} />);
      expect(screen.getByDisplayValue("my-article")).toBeTruthy();
    });

    it("saves the article and redirects on submit", async () => {
      vi.mocked(clientApi.updateArticle).mockResolvedValueOnce(
        existingArticle as any,
      );
      vi.mocked(clientApi.revalidateContent).mockResolvedValueOnce(
        undefined as any,
      );

      const { container } = render(<ArticleEditor article={existingArticle} />);

      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(clientApi.updateArticle).toHaveBeenCalledWith(
          "art-1",
          expect.any(Object),
        );
        expect(routerPush).toHaveBeenCalledWith("/admin/articles");
        expect(routerRefresh).toHaveBeenCalled();
      });
    });

    it("shows an error message when save fails", async () => {
      vi.mocked(clientApi.updateArticle).mockRejectedValueOnce(
        new Error("Update failed"),
      );

      const { container } = render(<ArticleEditor article={existingArticle} />);

      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeTruthy();
        expect(screen.getByText("Update failed")).toBeTruthy();
      });
    });

    it("does not show a delete button (article editor has no delete)", () => {
      render(<ArticleEditor article={existingArticle} />);
      expect(screen.queryByRole("button", { name: /Delete/i })).toBeNull();
    });

    it("calls router.back when Cancel is clicked", () => {
      render(<ArticleEditor article={existingArticle} />);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(routerBack).toHaveBeenCalledTimes(1);
    });
  });

  describe("auto-slug generation", () => {
    it("auto-generates slug from title in create mode", async () => {
      const { container } = render(<ArticleEditor isNew />);

      // Title is the first text input in the form
      const titleInput = container.querySelectorAll("input.form-control")[0];
      fireEvent.change(titleInput, { target: { value: "Hello World" } });

      // The slug field should eventually be auto-populated via useEffect
      await waitFor(() => {
        expect(screen.getByDisplayValue("hello-world")).toBeTruthy();
      });
    });
  });
});
