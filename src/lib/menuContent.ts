import { slugify } from "@/lib/slugify";
import {
  apiService,
  type MenuCategory,
  type MenuItem,
  type MenuItemPage,
} from "@/lib/api";
import {
  normalizeOrderedMenuItemIds,
  orderEntitiesByIds,
} from "@/lib/menuLayout";

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

export function orderMenuItemsByLayout(
  items: MenuItem[],
  orderedMenuItemIds: unknown,
): MenuItem[] {
  const normalizedOrder = normalizeOrderedMenuItemIds(orderedMenuItemIds);
  return orderEntitiesByIds(items, normalizedOrder);
}

export async function getMenuLayoutOrderIds(
  menuKey = "primary",
): Promise<string[]> {
  try {
    const layoutRes = await apiService.getMenuLayoutSettings(menuKey);
    if (layoutRes.statusCode !== 200) {
      return [];
    }

    return normalizeOrderedMenuItemIds(layoutRes.data?.orderedMenuItemIds);
  } catch (error) {
    console.error("[Menu] Failed to fetch menu layout settings:", error);
    return [];
  }
}

export async function getOrderedPublishedMenuItems(
  menuKey = "primary",
): Promise<MenuItem[]> {
  const publishedItems = await getPublishedMenuItems();
  const orderIds = await getMenuLayoutOrderIds(menuKey);
  return orderMenuItemsByLayout(publishedItems, orderIds);
}

export async function getPublishedMenuItemContent(
  item: MenuItem,
): Promise<PublishedMenuItemContent> {
  let directPages = (item.pages ?? []).filter(
    (page) => page.status === "published" && !page.menuCategoryId,
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
          (page) => page.status === "published" && !page.menuCategoryId,
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
  if (slugify(item.title) === "tools") {
    return "/pages/tools";
  }

  if (item.publishedCategories.length === 0 && item.directPages.length === 1) {
    return `/${item.directPages[0].slug}`;
  }

  return `/pages/${slugify(item.title)}`;
}
