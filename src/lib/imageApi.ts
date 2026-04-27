import type { CreateImageInput, ImageAsset, UpdateImageInput } from "@/lib/api";
import { adminRequest, buildAdminPath } from "@/lib/clientApi";

export const IMAGE_ASSET_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const IMAGE_ASSET_MAX_BYTES = 3 * 1024 * 1024;

type ImageValidationOptions = {
  minWidth?: number;
  minHeight?: number;
  minimumLabel?: string;
};

function getImageDimensions(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
    };

    image.onload = () => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      cleanup();

      if (!width || !height) {
        reject(new Error("Unable to read image dimensions."));
        return;
      }

      resolve({ width, height });
    };

    image.onerror = () => {
      cleanup();
      reject(new Error("Unable to read image dimensions."));
    };

    image.src = objectUrl;
  });
}

export async function validateImageFile(
  file: File,
  options?: ImageValidationOptions,
): Promise<string | null> {
  if (
    !IMAGE_ASSET_ALLOWED_TYPES.includes(
      file.type as (typeof IMAGE_ASSET_ALLOWED_TYPES)[number],
    )
  ) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > IMAGE_ASSET_MAX_BYTES) {
    return "Image files must be 3 MB or smaller.";
  }

  if (options?.minWidth || options?.minHeight) {
    try {
      const { width, height } = await getImageDimensions(file);
      const minWidth = options.minWidth ?? 0;
      const minHeight = options.minHeight ?? 0;

      if (width < minWidth || height < minHeight) {
        const minimumLabel = options.minimumLabel || "Images";
        return `${minimumLabel} must be at least ${minWidth}x${minHeight} pixels.`;
      }
    } catch {
      return "Unable to validate image dimensions.";
    }
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
