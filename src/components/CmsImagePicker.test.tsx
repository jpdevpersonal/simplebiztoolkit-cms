import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      screen.getByRole("button", { name: "Edit featured image" }),
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
      screen.getByRole("button", { name: "Edit featured image" }),
    );
    await user.click(screen.getByRole("button", { name: "Show upload form" }));

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
    await user.click(screen.getByRole("button", { name: "Edit header image" }));

    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /header.png/i }));
    await user.click(
      screen.getByRole("button", { name: "Show image details" }),
    );
    await user.click(screen.getByRole("button", { name: "Delete image" }));

    await waitFor(() => {
      expect(imageApi.deleteImage).toHaveBeenCalledWith("img-2");
    });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText("Image deleted.")).toBeInTheDocument();
  });

  it("uploads a valid image and selects it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();

    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);
    vi.mocked(imageApi.createImage).mockResolvedValueOnce({
      id: "img-3",
      url: "https://cdn.example.com/new.webp",
      blobName: "new.webp",
      altText: "Uploaded alt",
      caption: "Uploaded caption",
      createdUtc: "2026-03-20T00:00:00Z",
      updatedUtc: "2026-03-21T00:00:00Z",
    } as never);

    render(<CmsImagePicker label="featured image" onChangeAction={onChange} />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );
    await user.click(screen.getByRole("button", { name: "Show upload form" }));

    await user.upload(
      screen.getByLabelText("File"),
      new File(["good"], "new.webp", { type: "image/webp" }),
    );
    await user.type(screen.getByLabelText("Alt text"), "Uploaded alt");
    await user.type(screen.getByLabelText("Caption"), "Uploaded caption");
    await user.click(screen.getByRole("button", { name: "Upload image" }));

    await waitFor(() => {
      expect(imageApi.createImage).toHaveBeenCalled();
    });
    expect(vi.mocked(imageApi.createImage).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        altText: "Uploaded alt",
        caption: "Uploaded caption",
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "img-3",
        url: "https://cdn.example.com/new.webp",
      }),
    );
    expect(
      screen.getByText("Image uploaded successfully."),
    ).toBeInTheDocument();
  });

  it("saves metadata updates for the selected image", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const onChange = vi.fn();

    vi.mocked(imageApi.getImages).mockResolvedValueOnce([
      {
        id: "img-4",
        url: "https://cdn.example.com/original.webp",
        blobName: "original.webp",
        altText: "Original alt",
        caption: "Original caption",
        createdUtc: "2026-03-20T00:00:00Z",
        updatedUtc: "2026-03-21T00:00:00Z",
      },
    ] as never);
    vi.mocked(imageApi.updateImage).mockResolvedValueOnce({
      id: "img-4",
      url: "https://cdn.example.com/updated.webp",
      blobName: "updated.webp",
      altText: "Updated alt",
      caption: "Updated caption",
      createdUtc: "2026-03-20T00:00:00Z",
      updatedUtc: "2026-03-22T00:00:00Z",
    } as never);

    render(<CmsImagePicker label="header image" onChangeAction={onChange} />);
    await user.click(screen.getByRole("button", { name: "Edit header image" }));
    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /original.webp/i }));
    await user.click(
      screen.getByRole("button", { name: "Show image details" }),
    );
    await user.clear(screen.getByLabelText("Alt text"));
    await user.type(screen.getByLabelText("Alt text"), "Updated alt");
    await user.clear(screen.getByLabelText("Caption"));
    await user.type(screen.getByLabelText("Caption"), "Updated caption");
    await user.upload(
      screen.getByLabelText("Replace file"),
      new File(["replacement"], "replacement.webp", { type: "image/webp" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Save image details" }),
    );

    await waitFor(() => {
      expect(imageApi.updateImage).toHaveBeenCalledWith(
        "img-4",
        expect.objectContaining({
          altText: "Updated alt",
          caption: "Updated caption",
          file: expect.any(File),
        }),
      );
    });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: "img-4",
        url: "https://cdn.example.com/updated.webp",
      }),
    );
    expect(screen.getByText("Image details saved.")).toBeInTheDocument();
  });

  it("shows a library loading error when images cannot be fetched", async () => {
    const user = userEvent.setup();

    vi.mocked(imageApi.getImages).mockRejectedValueOnce(
      new Error("Unable to load library."),
    );

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Unable to load library.",
      );
    });
  });

  it("disables save button when no edits have been made", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([
      {
        id: "img-5",
        url: "https://cdn.example.com/photo.webp",
        blobName: "photo.webp",
        altText: "Photo alt",
        caption: "Photo caption",
        createdUtc: "2026-03-20T00:00:00Z",
        updatedUtc: "2026-03-21T00:00:00Z",
      },
    ]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );
    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /photo.webp/i }));

    await user.click(
      screen.getByRole("button", { name: "Show image details" }),
    );

    expect(
      screen.getByRole("button", { name: "Save image details" }),
    ).toBeDisabled();
  });

  it("enables save button after editing alt text", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([
      {
        id: "img-6",
        url: "https://cdn.example.com/banner.webp",
        blobName: "banner.webp",
        altText: "Banner",
        caption: "",
        createdUtc: "2026-03-20T00:00:00Z",
        updatedUtc: "2026-03-21T00:00:00Z",
      },
    ]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );
    await waitFor(() => {
      expect(imageApi.getImages).toHaveBeenCalled();
    });

    await user.click(screen.getByRole("button", { name: /banner.webp/i }));

    await user.click(
      screen.getByRole("button", { name: "Show image details" }),
    );

    expect(
      screen.getByRole("button", { name: "Save image details" }),
    ).toBeDisabled();

    await user.clear(screen.getByLabelText("Alt text"));
    await user.type(screen.getByLabelText("Alt text"), "New alt text");

    expect(
      screen.getByRole("button", { name: "Save image details" }),
    ).toBeEnabled();
  });

  it("opens in a modal dialog", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toBeInTheDocument();
  });

  it("starts upload and edit sections collapsed when the modal opens", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );

    expect(
      screen.getByRole("button", { name: "Show upload form" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.getByRole("button", { name: "Show image details" }),
    ).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByLabelText("File")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save image details" }),
    ).not.toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);

    render(<CmsImagePicker label="featured image" />);
    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders caller-provided modal content", async () => {
    const user = userEvent.setup();
    vi.mocked(imageApi.getImages).mockResolvedValueOnce([]);

    render(
      <CmsImagePicker
        label="featured image"
        modalAdditionalContent={
          <section className="cms-image-picker-section">
            <div>Thumbnail framing controls</div>
          </section>
        }
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Edit featured image" }),
    );

    expect(screen.getByText("Thumbnail framing controls")).toBeInTheDocument();
  });
});
