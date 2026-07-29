/**
 * Edit / View Menu Item Page – Admin
 * Shows the edit form, categories table, and pages belonging to this menu item.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuItemEditor from "@/components/MenuItemEditor";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: Props) {
  const { id } = await params;
  const { service } = await getAdminApiService();

  const [itemResponse, catResponse, pagesResponse] = await Promise.all([
    service.getMenuItemById(id),
    service.getMenuCategories(id),
    service.getMenuItemPages(undefined, undefined, id),
  ]);

  if (!itemResponse.data) return notFound();

  const menuItem = itemResponse.data;
  const categories = catResponse.data || [];
  const allPages = pagesResponse.data || [];
  const breadcrumbItems = [{ href: "/cms/menu", label: "Menu Items" }];

  const plusIcon = (
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
  );

  return (
    <div className="admin-page-shell">
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Edit: {menuItem.title}</h1>
        </div>
      </div>

      {/* Edit form */}
      <MenuItemEditor menuItem={menuItem} />

      {/* ── Topics ─────────────────────────────────────────── */}
      <div className="admin-page-header admin-subsection-header">
        <h2>
          Topics
          <span className="admin-heading-count">({categories.length})</span>
        </h2>
        <Link
          href={`/cms/menu/${id}/categories/new`}
          className="admin-btn-save"
        >
          {plusIcon} New Topic
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Pages</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="admin-empty-state">
                  No topics yet. Add the first one or add pages directly below.
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td className="admin-cell-strong" data-label="Title">
                  {cat.title}
                </td>
                <td data-label="Status">
                  <StatusBadge status={cat.status} />
                </td>
                <td className="admin-cell-muted" data-label="Pages">
                  {allPages.filter((p) => p.menuCategoryId === cat.id).length}
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

      {/* ── Pages ──────────────────────────────────────────────── */}
      <div className="admin-page-header admin-subsection-header">
        <h2>
          Pages
          <span className="admin-heading-count">({allPages.length})</span>
        </h2>
        <Link
          href={`/cms/pages/new?menuItemId=${id}`}
          className="admin-btn-save"
        >
          {plusIcon} New Page
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPages.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-state">
                  No pages yet. Create a page using the button above.
                </td>
              </tr>
            )}
            {allPages.map((page) => {
              const catName = page.menuCategoryId
                ? (categories.find((c) => c.id === page.menuCategoryId)
                    ?.title ?? "Unknown")
                : null;
              return (
                <tr key={page.id}>
                  <td className="admin-cell-strong" data-label="Title">
                    {page.title}
                  </td>
                  <td className="admin-cell-code" data-label="Slug">
                    {page.slug}
                  </td>
                  <td className="admin-cell-muted" data-label="Topic">
                    {catName ?? (
                      <span className="admin-cell-italic-faded">Direct</span>
                    )}
                  </td>
                  <td data-label="Status">
                    <StatusBadge status={page.status} />
                  </td>
                  <td className="admin-cell-actions" data-label="Actions">
                    <div className="admin-action-group">
                      <Link
                        href={`/cms/pages/${page.id}/edit`}
                        className="admin-btn-action"
                      >
                        Edit
                      </Link>
                      {page.status === "published" && (
                        <a
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn-action admin-btn-action-muted"
                          title="Preview"
                        >
                          ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom breadcrumb */}
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
