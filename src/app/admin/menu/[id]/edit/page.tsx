/**
 * Edit / View Menu Item Page – Admin
 * Shows the edit form, categories table, and pages belonging to this menu item.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuItemEditor from "@/components/MenuItemEditor";

function StatusBadge({ status }: { status?: string }) {
  const published = status === "published";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.55rem",
        borderRadius: "999px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: published ? "#dcfce7" : "#fef9c3",
        color: published ? "#166534" : "#854d0e",
      }}
    >
      {status ?? "draft"}
    </span>
  );
}

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
    <div>
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
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          Topics
          <span
            style={{
              fontWeight: 400,
              fontSize: "0.85rem",
              color: "var(--sb-muted)",
              marginLeft: "0.5rem",
            }}
          >
            ({categories.length})
          </span>
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
                <td style={{ fontWeight: 600 }}>{cat.title}</td>
                <td>
                  <StatusBadge status={cat.status} />
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {allPages.filter((p) => p.menuCategoryId === cat.id).length}
                </td>
                <td>
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
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          Pages
          <span
            style={{
              fontWeight: 400,
              fontSize: "0.85rem",
              color: "var(--sb-muted)",
              marginLeft: "0.5rem",
            }}
          >
            ({allPages.length})
          </span>
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
                  <td style={{ fontWeight: 600 }}>{page.title}</td>
                  <td
                    style={{
                      color: "var(--sb-muted)",
                      fontSize: "0.85rem",
                      fontFamily: "monospace",
                    }}
                  >
                    {page.slug}
                  </td>
                  <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                    {catName ?? <em style={{ opacity: 0.5 }}>Direct</em>}
                  </td>
                  <td>
                    <StatusBadge status={page.status} />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
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
                          className="admin-btn-action"
                          style={{ opacity: 0.6 }}
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
