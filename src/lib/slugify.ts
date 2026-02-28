/**
 * Generate a URL-safe slug from a string.
 * Used to create slugs for MenuItems and MenuCategories
 * which don't have slug fields in the API.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
