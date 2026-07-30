/**
 * Edit Category Page – Admin
 * Shows the category edit form and the pages belonging to this category.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuCategoryEditor from "@/components/MenuCategoryEditor";
import StatusBadge from "@/components/StatusBadge";

interface Props {
  params: Promise<{ catId: string }>;
}

export default async function EditMenuCategoryPage({ params }: Props) {
  const { catId } = await params;
  const { service } = await getAdminApiService();

  const [catResponse, pagesResponse] = await Promise.all([
    service.getMenuCategoryById(catId),
    service.getMenuItemPages(catId),
  ]);

  if (!catResponse.data) return notFound();

  const category = catResponse.data;
  const pages = pagesResponse.data || [];
  const breadcrumbItems = [
    { href: "/cms/menu", label: "Menu Items" },
    { href: `/cms/menu/${category.menuItemId}/edit`, label: "Menu Item" },
  ];

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
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Edit Topic: {category.title}</h1>
        </div>
      </div>

      {/* Category edit form */}
      <MenuCategoryEditor
        category={category}
        menuItemId={category.menuItemId}
      />

      {/* ── Pages in this Category ─────────────────────────────── */}
      <div className="admin-page-header admin-subsection-header">
        <h2>Pages in this Topic</h2>
        <Link
          href={`/cms/pages/new?menuItemId=${category.menuItemId}&categoryId=${catId}`}
          className="admin-btn-save"
        >
          {plusIcon}
          New Page
        </Link>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-state">
                  No pages yet. Create the first one!
                </td>
              </tr>
            )}
            {pages.map((page) => (
              <tr key={page.id}>
                <td className="admin-cell-strong" data-label="Title">
                  {page.title}
                </td>
                <td className="admin-cell-code" data-label="Slug">
                  {page.slug}
                </td>
                <td data-label="Status">
                  <StatusBadge status={page.status} />
                </td>
                <td className="admin-cell-muted-sm" data-label="Date">
                  {page.dateISO}
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
