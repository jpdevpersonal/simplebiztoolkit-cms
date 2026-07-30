/**
 * Menu Items List Page - Admin
 * Loads navigation relationships for the segmented management overview.
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminMenuOverview from "@/components/AdminMenuOverview";
import AdminStatCard from "@/components/AdminStatCard";

export default async function MenuPage() {
  const { service } = await getAdminApiService();

  const [itemsResponse, categoriesResponse, pagesResponse] = await Promise.all([
    service.getMenuItems(),
    service.getMenuCategories(),
    service.getMenuItemPages(),
  ]);

  const menuItems = itemsResponse.data || [];
  const allCategoriesRaw = categoriesResponse.data || [];
  const allPagesRaw = pagesResponse.data || [];

  const itemTitleMap = new Map(menuItems.map((item) => [item.id, item.title]));
  const categoryMap = new Map(
    allCategoriesRaw.map((category) => [
      category.id,
      { title: category.title, menuItemId: category.menuItemId },
    ]),
  );

  const categories = allCategoriesRaw.map((category) => ({
    ...category,
    menuItemTitle: itemTitleMap.get(category.menuItemId) ?? "Unknown",
    pageCount: allPagesRaw.filter((page) => page.menuCategoryId === category.id)
      .length,
  }));

  const pages = allPagesRaw.map((page) => {
    const category = page.menuCategoryId
      ? categoryMap.get(page.menuCategoryId)
      : null;

    return {
      ...page,
      menuItemTitle:
        itemTitleMap.get(page.menuItemId ?? category?.menuItemId ?? "") ??
        "Unknown",
      categoryTitle: category?.title ?? (null as string | null),
    };
  });

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Navigation system</div>
          <h1>Menu Items</h1>
          <p className="admin-page-description">
            Review top-level navigation, topic groupings, and assigned pages
            without losing your place in the site structure.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">
            {categories.length} topics tracked
          </span>
        </div>
      </div>

      <div className="row g-3 mb-1">
        <div className="col-12 col-md-4">
          <AdminStatCard label="Menu Items" value={menuItems.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Topics" value={categories.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Pages" value={pages.length} />
        </div>
      </div>

      <AdminMenuOverview
        menuItems={menuItems}
        categories={categories}
        pages={pages}
      />
    </div>
  );
}
