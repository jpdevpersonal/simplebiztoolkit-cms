import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CmsImagePicker from "./CmsImagePicker";
import { imageApi } from "@/lib/imageApi";

vi.mock("@/lib/imageApi", () => ({
  imageApi: {
    getImages: vi.fn(),
    createImage: vi.fn(),
    updateImage: vi.fn(),
    deleteImage: vi.fn(),
  },
  validateImageFile: vi.fn((file: File) => {
    if (file.type === "image/gif") {
      return "Use a JPG, PNG, or WebP image.";
    }

    return null;
  }),
}));

describe("CmsImagePicker", () => {
  it("loads the library and returns the selected image", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([
      {
        id: "img-1",
        url: "https://cdn.example.com/hero.webp",
        blobName: "hero.webp",
        altText: "Hero",
        caption: "Caption",
        createdUtc: "2026-03-20T00:00:00Z",
        updatedUtc: "2026-03-21T00:00:00Z",
      },
    ]);

    render(<CmsImagePicker label="featured image" onChangeAction={onChange} />);

    await user.click(
      screen.getByRole("button", { name: "Manage featured image" }),
    );

    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /hero.webp/i }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "img-1",
        url: "https://cdn.example.com/hero.webp",
      }),
    );
    expect(screen.getByText("Image selected.")).toBeInTheDocument();
  });

  it("blocks invalid uploads locally", async () => {
    const user = userEvent.setup({ applyAccept: false });
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Manage featured image" }),
    );

    const fileInput = screen.getByLabelText("File") as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(["bad"], "bad.gif", { type: "image/gif" }),
    );
    await user.click(screen.getByRole("button", { name: "Upload image" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use a JPG, PNG, or WebP image.",
    );
    expect(imageApi.createImage).not.toHaveBeenCalled();
  });

  it("confirms and deletes the selected image", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([
      {
        id: "img-2",
        url: "https://cdn.example.com/header.png",
        blobName: "header.png",
        altText: "Header",
        caption: "Header caption",
        createdUtc: "2026-03-20T00:00:00Z",
        updatedUtc: "2026-03-21T00:00:00Z",
      },
    ]);
    vi.mocked(imageApi.deleteImage).mockResolvedValueOnce(undefined as never);

    render(<CmsImagePicker label="header image" onChangeAction={onChange} />);
    await user.click(
      screen.getByRole("button", { name: "Manage header image" }),
    );

    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /header.png/i }));
    await user.click(screen.getByRole("button", { name: "Delete image" }));

    await waitFor(() => {
      expect(imageApi.deleteImage).toHaveBeenCalledWith("img-2");
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("Image deleted.")).toBeInTheDocument();
  });
});
