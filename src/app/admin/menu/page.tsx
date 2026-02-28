/**
 * Menu Items List Page - Admin
 * Lists all navigation menu items with their categories and pages
 */

import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import AdminStatCard from "@/components/AdminStatCard";

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

export default async function MenuPage() {
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getMenuItems();
  const menuItems = response.data || [];

  const allCategories = menuItems.flatMap((item) =>
    (item.categories ?? []).map((cat) => ({
      ...cat,
      menuItemTitle: item.title,
    })),
  );

  const allPages = menuItems.flatMap((item) => [
    // Pages under categories
    ...(item.categories ?? []).flatMap((cat) =>
      (cat.pages ?? []).map((page) => ({
        ...page,
        menuItemTitle: item.title,
        categoryTitle: cat.title,
        categoryId: cat.id,
        menuItemId: item.id,
      })),
    ),
    // Pages directly under menu item (no category)
    ...(item.pages ?? []).map((page) => ({
      ...page,
      menuItemTitle: item.title,
      categoryTitle: null as string | null,
      categoryId: null as string | null,
      menuItemId: item.id,
    })),
  ]);

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Menu Items</h1>
        <Link href="/admin/menu/new" className="admin-btn-save">
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

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <AdminStatCard label="Menu Items" value={menuItems.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Categories" value={allCategories.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Pages" value={allPages.length} />
        </div>
      </div>

      {/* Menu items table */}
      <h2 className="admin-section-heading">Menu Items</h2>
      <div className="admin-table-wrap mb-5">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Categories</th>
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
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {item.categories?.length ?? 0}
                </td>
                <td>
                  <Link
                    href={`/admin/menu/${item.id}/edit`}
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

      {/* Categories table */}
      <div className="admin-page-header">
        <h2 className="admin-section-heading" style={{ margin: 0 }}>
          Categories
        </h2>
      </div>
      <div className="admin-table-wrap mb-5">
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
                  No categories found.
                </td>
              </tr>
            )}
            {allCategories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 600 }}>{cat.title}</td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {cat.menuItemTitle}
                </td>
                <td>
                  <StatusBadge status={cat.status} />
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {cat.pages?.length ?? 0}
                </td>
                <td>
                  <Link
                    href={`/admin/menu/categories/${cat.id}/edit`}
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

      {/* Menu Pages table */}
      <div className="admin-page-header">
        <h2 className="admin-section-heading" style={{ margin: 0 }}>
          Menu Pages
        </h2>
      </div>
      <div className="admin-table-wrap mb-5">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Menu Item</th>
              <th>Category</th>
              <th>Slug</th>
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
                <td style={{ fontWeight: 600 }}>{page.title}</td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {page.menuItemTitle}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {page.categoryTitle ?? (
                    <span style={{ fontStyle: "italic", opacity: 0.6 }}>
                      None
                    </span>
                  )}
                </td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                  }}
                >
                  {page.slug}
                </td>
                <td>
                  <StatusBadge status={page.status} />
                </td>
                <td>
                  <Link
                    href={`/admin/pages/${page.id}/edit`}
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
    </div>
  );
}
