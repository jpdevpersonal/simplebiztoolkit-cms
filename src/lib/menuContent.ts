import { slugify } from "@/lib/slugify";
import {
  apiService,
  type MenuCategory,
  type MenuItem,
  type MenuItemPage,
} from "@/lib/api";

export type PublishedMenuCategory = MenuCategory & {
  publishedPages: MenuItemPage[];
};

export type PublishedMenuItemContent = MenuItem & {
  directPages: MenuItemPage[];
  publishedCategories: PublishedMenuCategory[];
  totalPages: number;
};

export async function getPublishedMenuItems(): Promise<MenuItem[]> {
  let menuRes = await apiService.getPublishedMenuItems();
  if (menuRes.statusCode === 404) {
    menuRes = await apiService.getMenuItems();
  }

  return (menuRes.data ?? []).filter((item) => item.status === "published");
}

export async function getPublishedMenuItemContent(
  item: MenuItem,
): Promise<PublishedMenuItemContent> {
  let directPages = (item.pages ?? []).filter(
    (page) => page.status === "published",
  );

  if (directPages.length === 0) {
    try {
      const pagesRes = await apiService.getMenuItemPages(
        undefined,
        "published",
        item.id,
      );
      if (pagesRes.statusCode === 200) {
        directPages = (pagesRes.data ?? []).filter(
          (page) => page.status === "published",
        );
      }
    } catch (error) {
      console.error(
        `[Menu] Failed to fetch direct pages for ${item.id}:`,
        error,
      );
    }
  }

  const publishedCategories = (item.categories ?? [])
    .filter((category) => category.status === "published")
    .map((category) => ({
      ...category,
      publishedPages: (category.pages ?? []).filter(
        (page) => page.status === "published",
      ),
    }))
    .filter((category) => category.publishedPages.length > 0);

  const totalPages =
    directPages.length +
    publishedCategories.reduce(
      (sum, category) => sum + category.publishedPages.length,
      0,
    );

  return {
    ...item,
    directPages,
    publishedCategories,
    totalPages,
  };
}

export function getMenuItemLandingHref(
  item: Pick<
    PublishedMenuItemContent,
    "title" | "directPages" | "publishedCategories"
  >,
): string {
  if (item.publishedCategories.length === 0 && item.directPages.length === 1) {
    return `/${item.directPages[0].slug}`;
  }

  return `/pages/${slugify(item.title)}`;
}
