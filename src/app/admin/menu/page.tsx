/**
 * Menu Items List Page - Admin
 * Lists all navigation menu items with their categories and pages
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminStatCard from "@/components/AdminStatCard";

function StatusBadge({ status }: { status?: string }) {
  const published = status === "published";
  return (
    <span
      className={`admin-badge ${published ? "admin-badge-published" : "admin-badge-draft"}`}
    >
      {status ?? "draft"}
    </span>
  );
}

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

  // Build lookup map: menuItemId → title
  const itemTitleMap = new Map(menuItems.map((m) => [m.id, m.title]));
  // Build lookup map: categoryId → { title, menuItemId }
  const catMap = new Map(
    allCategoriesRaw.map((c) => [
      c.id,
      { title: c.title, menuItemId: c.menuItemId },
    ]),
  );

  const allCategories = allCategoriesRaw.map((cat) => ({
    ...cat,
    menuItemTitle: itemTitleMap.get(cat.menuItemId) ?? "Unknown",
    pageCount: allPagesRaw.filter((p) => p.menuCategoryId === cat.id).length,
  }));

  const allPages = allPagesRaw.map((page) => {
    const catInfo = page.menuCategoryId
      ? catMap.get(page.menuCategoryId)
      : null;
    return {
      ...page,
      menuItemTitle:
        itemTitleMap.get(page.menuItemId ?? catInfo?.menuItemId ?? "") ??
        "Unknown",
      categoryTitle: catInfo?.title ?? (null as string | null),
    };
  });

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Navigation system</div>
          <h1>Menu Items</h1>
          <p className="admin-page-description">
            Keep the site structure easy to scan by separating menu items,
            topics, and menu pages into distinct sections.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">
            {allCategories.length} topics tracked
          </span>
          <Link href="/cms/menu/new" className="admin-btn-save">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            New Menu Item
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <AdminStatCard label="Menu Items" value={menuItems.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Topics" value={allCategories.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Pages" value={allPages.length} />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">Primary navigation</div>
            <h2 className="admin-section-card-title">Menu items</h2>
            <p className="admin-section-card-copy">
              See how many topics each top-level menu item contains, then open
              the editor directly.
            </p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Topics</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-state">
                    No menu items found. Create your first menu item!
                  </td>
                </tr>
              )}
              {menuItems.map((item) => (
                <tr key={item.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {item.title}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="admin-cell-muted" data-label="Topics">
                    {
                      allCategoriesRaw.filter((c) => c.menuItemId === item.id)
                        .length
                    }
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/menu/${item.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Secondary grouping</div>
          <h2>Topics</h2>
          <p className="admin-page-description">
            Topic sections make it easier to understand which menu item owns
            each cluster of pages.
          </p>
        </div>
        <div className="admin-page-actions">
          {menuItems.length > 0 && (
            <Link
              href={`/cms/menu/${menuItems[0].id}/categories/new`}
              className="admin-btn-save"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <line
                  x1="12"
                  y1="5"
                  x2="12"
                  y2="19"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <line
                  x1="5"
                  y1="12"
                  x2="19"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              New Topic
            </Link>
          )}
        </div>
      </div>
      <section className="admin-section-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Menu Item</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-empty-state">
                    No topics found.
                  </td>
                </tr>
              )}
              {allCategories.map((cat) => (
                <tr key={cat.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {cat.title}
                  </td>
                  <td className="admin-cell-muted" data-label="Menu Item">
                    {cat.menuItemTitle}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={cat.status} />
                  </td>
                  <td className="admin-cell-muted" data-label="Pages">
                    {cat.pageCount}
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/menu/categories/${cat.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Assigned pages</div>
          <h2>Menu Pages</h2>
          <p className="admin-page-description">
            Review which pages belong to which menu item or topic before moving
            into the full editor.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href="/cms/pages/new" className="admin-btn-save">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            New Page
          </Link>
        </div>
      </div>
      <section className="admin-section-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Menu Item</th>
                <th className="admin-col-phone-hide">Topic</th>
                <th className="admin-col-tablet-hide admin-col-phone-hide">
                  Slug
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allPages.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    No pages found.
                  </td>
                </tr>
              )}
              {allPages.map((page) => (
                <tr key={page.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {page.title}
                  </td>
                  <td className="admin-cell-muted" data-label="Menu Item">
                    {page.menuItemTitle}
                  </td>
                  <td
                    className="admin-cell-muted admin-col-phone-hide"
                    data-label="Topic"
                  >
                    {page.categoryTitle ?? (
                      <span className="admin-cell-italic-faded">None</span>
                    )}
                  </td>
                  <td
                    className="admin-cell-code admin-col-tablet-hide admin-col-phone-hide"
                    data-label="Slug"
                  >
                    {page.slug}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <Link
                      href={`/cms/pages/${page.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
