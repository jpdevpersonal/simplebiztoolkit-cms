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
    { href: "/admin/menu", label: "Menu Items" },
    { href: `/admin/menu/${menuItemId}/edit`, label: menuItem.title },
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
          href={`/admin/menu/${menuItemId}/categories/new`}
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
                <td style={{ fontWeight: 600 }}>{cat.title}</td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.875rem",
                    maxWidth: "260px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {cat.description || "—"}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {cat.pages?.length ?? 0}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <Link
                      href={`/admin/menu/categories/${cat.id}/edit`}
                      className="admin-btn-action"
                    >
                      Pages
                    </Link>
                    <Link
                      href={`/admin/menu/categories/${cat.id}/edit`}
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
