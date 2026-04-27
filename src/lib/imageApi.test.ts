import { describe, expect, it, vi } from "vitest";
import { imageApi, validateImageFile } from "@/lib/imageApi";
import { adminRequest } from "@/lib/clientApi";

vi.mock("@/lib/clientApi", () => ({
  adminRequest: vi.fn(),
  buildAdminPath: (resource: string, id?: string) =>
    id ? `/api/admin/${resource}/${id}` : `/api/admin/${resource}`,
}));

describe("imageApi", () => {
  it("creates multipart FormData with exact field names", async () => {
    vi.mocked(adminRequest).mockResolvedValueOnce({ id: "img-1" } as never);
    const file = new File(["binary"], "hero.webp", { type: "image/webp" });

    await imageApi.createImage({
      file,
      altText: "Hero alt",
      caption: "Hero caption",
    });

    const [, options] = vi.mocked(adminRequest).mock.calls[0];
    const body = options?.body as FormData;

    expect(vi.mocked(adminRequest)).toHaveBeenCalledWith("/api/admin/images", {
      method: "POST",
      body: expect.any(FormData),
    });
    expect(body.get("file")).toBe(file);
    expect(body.get("altText")).toBe("Hero alt");
    expect(body.get("caption")).toBe("Hero caption");
  });

  it("omits file on metadata-only update", async () => {
    vi.mocked(adminRequest).mockResolvedValueOnce({ id: "img-1" } as never);

    await imageApi.updateImage("img-1", {
      altText: "Updated alt",
      caption: "",
    });

    const [, options] = vi.mocked(adminRequest).mock.calls[0];
    const body = options?.body as FormData;

    expect(vi.mocked(adminRequest)).toHaveBeenCalledWith(
      "/api/admin/images/img-1",
      {
        method: "PUT",
        body: expect.any(FormData),
      },
    );
    expect(body.has("file")).toBe(false);
    expect(body.get("altText")).toBe("Updated alt");
    expect(body.get("caption")).toBe("");
  });

  it("validates allowed file types and size", async () => {
    const gifFile = new File(["binary"], "bad.gif", { type: "image/gif" });
    const oversizedFile = new File(
      ["a".repeat(3 * 1024 * 1024 + 1)],
      "big.png",
      {
        type: "image/png",
      },
    );
    const validFile = new File(["ok"], "ok.png", { type: "image/png" });

    expect(await validateImageFile(gifFile)).toBe(
      "Use a JPG, PNG, or WebP image.",
    );
    expect(await validateImageFile(oversizedFile)).toBe(
      "Image files must be 3 MB or smaller.",
    );
    expect(await validateImageFile(validFile)).toBeNull();
  });

  it("validates minimum dimensions when a caller requires them", async () => {
    const createObjectURL = vi.fn(() => "blob:thumbnail");
    const revokeObjectURL = vi.fn();

    vi.stubGlobal("URL", {
      createObjectURL,
      revokeObjectURL,
    });

    vi.stubGlobal(
      "Image",
      class {
        onload: null | (() => void) = null;
        onerror: null | (() => void) = null;
        naturalWidth = 240;
        naturalHeight = 240;
        width = 240;
        height = 240;

        set src(_value: string) {
          this.onload?.();
        }
      },
    );

    const file = new File(["ok"], "small.png", { type: "image/png" });

    expect(
      await validateImageFile(file, {
        minWidth: 288,
        minHeight: 288,
        minimumLabel: "Related link thumbnails",
      }),
    ).toBe("Related link thumbnails must be at least 288x288 pixels.");
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:thumbnail");
  });
});
