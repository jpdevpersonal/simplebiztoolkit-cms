/**
 * Categories list for a specific Menu Item - Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import AdminStatCard from "@/components/AdminStatCard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MenuItemCategoriesPage({ params }: Props) {
  const { id: menuItemId } = await params;
  const { service } = await getAdminApiService();

  const [itemResponse, catResponse] = await Promise.all([
    service.getMenuItemById(menuItemId),
    service.getMenuCategories(menuItemId),
  ]);

  if (!itemResponse.data) return notFound();

  const menuItem = itemResponse.data;
  const categories = catResponse.data || [];
  const totalPages = categories.reduce(
    (sum, cat) => sum + (cat.pages?.length ?? 0),
    0,
  );
  const breadcrumbItems = [
    { href: "/cms/menu", label: "Menu Items" },
    { href: `/cms/menu/${menuItemId}/edit`, label: menuItem.title },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Topics</h1>
        </div>
        <Link
          href={`/cms/menu/${menuItemId}/categories/new`}
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
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <AdminStatCard label="Topics" value={categories.length} />
        </div>
        <div className="col-6">
          <AdminStatCard label="Total Pages" value={totalPages} />
        </div>
      </div>

      {/* Categories Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  No topics yet. Add the first one!
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="admin-cell-strong" data-label="Title">
                  {cat.title}
                </td>
                <td
                  className="admin-cell-muted admin-cell-ellipsis admin-cell-max-280"
                  data-label="Description"
                >
                  {cat.description || "—"}
                </td>
                <td className="admin-cell-muted" data-label="Pages">
                  {cat.pages?.length ?? 0}
                </td>
                <td className="admin-cell-actions" data-label="Actions">
                  <div className="admin-action-group">
                    <Link
                      href={`/cms/menu/categories/${cat.id}/edit`}
                      className="admin-btn-action"
                    >
                      Pages
                    </Link>
                    <Link
                      href={`/cms/menu/categories/${cat.id}/edit`}
                      className="admin-btn-action"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
