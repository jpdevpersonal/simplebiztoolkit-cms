import type { CreateImageInput, ImageAsset, UpdateImageInput } from "@/lib/api";
import { adminRequest, buildAdminPath } from "@/lib/clientApi";

export const IMAGE_ASSET_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_ASSET_MAX_BYTES = 2 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (
    !IMAGE_ASSET_ALLOWED_TYPES.includes(
      file.type as (typeof IMAGE_ASSET_ALLOWED_TYPES)[number],
    )
  ) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > IMAGE_ASSET_MAX_BYTES) {
    return "Image files must be 2 MB or smaller.";
  }

  return null;
}

function createImageFormData(
  input: UpdateImageInput & { file?: File },
): FormData {
  const formData = new FormData();

  if (input.file) {
    formData.append("file", input.file);
  }

  if (input.altText !== undefined) {
    formData.append("altText", input.altText);
  }

  if (input.caption !== undefined) {
    formData.append("caption", input.caption);
  }

  return formData;
}

export const imageApi = {
  getImages() {
    return adminRequest<ImageAsset[]>(buildAdminPath("images"));
  },

  getImage(id: string) {
    return adminRequest<ImageAsset>(buildAdminPath("images", id));
  },

  createImage(input: CreateImageInput) {
    return adminRequest<ImageAsset>(buildAdminPath("images"), {
      method: "POST",
      body: createImageFormData(input),
    });
  },

  updateImage(id: string, input: UpdateImageInput) {
    return adminRequest<ImageAsset>(buildAdminPath("images", id), {
      method: "PUT",
      body: createImageFormData(input),
    });
  },

  deleteImage(id: string) {
    return adminRequest<void>(buildAdminPath("images", id), {
      method: "DELETE",
    });
  },
};

export type { CreateImageInput, ImageAsset, UpdateImageInput };
