/**
 * On-Demand Revalidation for ISR
 * Called by C# API webhooks when content is updated
 */

import { revalidatePath, revalidateTag } from "next/cache";

function revalidatePublicProductPaths() {
  revalidatePath("/products");
  revalidatePath("/products/[categorySlug]", "page");
  revalidatePath("/products/[categorySlug]/[productSlug]", "page");
}

function revalidatePublicPagePaths(slugs?: string[]) {
  revalidatePath("/pages");
  revalidatePath("/pages/[menuItemSlug]", "page");
  revalidatePath("/pages/[menuItemSlug]/[categorySlug]", "page");

  for (const slug of slugs ?? []) {
    revalidatePath(`/${slug}`);
  }
}

/**
 * Revalidate specific product
 */
export async function revalidateProduct(slug: string) {
  revalidateTag("products");
  revalidateTag(`product-${slug}`);
  revalidatePublicProductPaths();
}

/**
 * Revalidate specific category
 */
export async function revalidateCategory(slug: string) {
  revalidateTag("products");
  revalidateTag(`category-${slug}`);
  revalidatePublicProductPaths();
}

/**
 * Revalidate all products
 */
export async function revalidateAllProducts() {
  revalidateTag("products");
  revalidatePublicProductPaths();
}

/**
 * Revalidate a specific CMS page and menu-derived listings.
 */
export async function revalidatePage(slug: string, previousSlug?: string) {
  revalidateTag("menu");

  const uniqueSlugs = Array.from(
    new Set(
      [slug, previousSlug]
        .map((candidate) => candidate?.trim())
        .filter((candidate): candidate is string => Boolean(candidate)),
    ),
  );

  for (const candidateSlug of uniqueSlugs) {
    revalidateTag(`menupage-${candidateSlug}`);
  }

  revalidatePublicPagePaths(uniqueSlugs);
}

/**
 * Revalidate all CMS pages and page listings.
 */
export async function revalidateAllPages() {
  revalidateTag("menu");
  revalidatePath("/[slug]", "page");
  revalidatePublicPagePaths();
}
