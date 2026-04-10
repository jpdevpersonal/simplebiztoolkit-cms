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
  revalidateAllPages,
  revalidateAllProducts,
  revalidateCategory,
  revalidatePage,
  revalidateProduct,
} from "./revalidation";

describe("revalidation", () => {
  it("revalidates product tags and public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateProduct("product-slug");

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidateTagMock).toHaveBeenCalledWith("product-product-slug");
    expect(revalidatePathMock).toHaveBeenCalledWith("/templates");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/templates/[categorySlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/templates/[categorySlug]/[productSlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidates category tags and public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateCategory("category-slug");

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidateTagMock).toHaveBeenCalledWith("category-category-slug");
    expect(revalidatePathMock).toHaveBeenCalledTimes(4);
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidates all public product routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateAllProducts();

    expect(revalidateTagMock).toHaveBeenCalledWith("products");
    expect(revalidatePathMock).toHaveBeenCalledTimes(4);
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidates page tags and public page routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidatePage("updated-page", "old-page");

    expect(revalidateTagMock).toHaveBeenCalledWith("menu");
    expect(revalidateTagMock).toHaveBeenCalledWith("menupage-updated-page");
    expect(revalidateTagMock).toHaveBeenCalledWith("menupage-old-page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/pages");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/pages/[menuItemSlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/pages/[menuItemSlug]/[categorySlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/updated-page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/old-page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });

  it("revalidates all public page routes", async () => {
    revalidatePathMock.mockClear();
    revalidateTagMock.mockClear();

    await revalidateAllPages();

    expect(revalidateTagMock).toHaveBeenCalledWith("menu");
    expect(revalidatePathMock).toHaveBeenCalledWith("/[slug]", "page");
    expect(revalidatePathMock).toHaveBeenCalledWith("/pages");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/pages/[menuItemSlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/pages/[menuItemSlug]/[categorySlug]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/sitemap.xml");
  });
});
