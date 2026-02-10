/**
 * On-Demand Revalidation for ISR
 * Called by C# API webhooks when content is updated
 */

import { revalidateTag } from "next/cache";

/**
 * Revalidate specific article
 */
export async function revalidateArticle(slug: string) {
  revalidateTag("articles");
  revalidateTag(`article-${slug}`);
}

/**
 * Revalidate all articles
 */
export async function revalidateAllArticles() {
  revalidateTag("articles");
}

/**
 * Revalidate specific product
 */
export async function revalidateProduct(slug: string) {
  revalidateTag("products");
  revalidateTag(`product-${slug}`);
}

/**
 * Revalidate specific category
 */
export async function revalidateCategory(slug: string) {
  revalidateTag("products");
  revalidateTag(`category-${slug}`);
}

/**
 * Revalidate all products
 */
export async function revalidateAllProducts() {
  revalidateTag("products");
}
