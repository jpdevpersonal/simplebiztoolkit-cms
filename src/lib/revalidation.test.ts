import { describe, expect, it, vi } from "vitest";

const { revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
}));

import {
  revalidateAllProducts,
  revalidateCategory,
  revalidateProduct,
} from "./revalidation";

describe("revalidation", () => {
  it("revalidates product tags and public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateProduct("product-slug");

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidateTagMock).toHaveBeenCalledWith("product-product-slug");
    expect(revalidatePathMock).toHaveBeenCalledWith("/products");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/products/[categorySlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/products/[categorySlug]/[productSlug]",
      "page",
    );
  });

  it("revalidates category tags and public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateCategory("category-slug");

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidateTagMock).toHaveBeenCalledWith("category-category-slug");
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });

  it("revalidates all public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateAllProducts();

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });
});
