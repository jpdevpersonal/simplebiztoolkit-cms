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

  it("validates allowed file types and size", () => {
    const gifFile = new File(["binary"], "bad.gif", { type: "image/gif" });
    const oversizedFile = new File(
      ["a".repeat(2 * 1024 * 1024 + 1)],
      "big.png",
      {
        type: "image/png",
      },
    );
    const validFile = new File(["ok"], "ok.png", { type: "image/png" });

    expect(validateImageFile(gifFile)).toBe("Use a JPG, PNG, or WebP image.");
    expect(validateImageFile(oversizedFile)).toBe(
      "Image files must be 2 MB or smaller.",
    );
    expect(validateImageFile(validFile)).toBeNull();
  });
});
