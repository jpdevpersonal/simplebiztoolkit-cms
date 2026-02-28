/**
 * Edit / View Menu Item Page – Admin
 * Shows the edit form, categories table, and all pages belonging to this menu item.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuItemEditor from "@/components/MenuItemEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: Props) {
  await headers();
  const { id } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const [itemResponse, catResponse, pagesResponse] = await Promise.all([
    service.getMenuItemById(id),
    service.getMenuCategories(id),
    service.getMenuItemPages(undefined, undefined, id),
  ]);

  if (!itemResponse.data) return notFound();

  const menuItem = itemResponse.data;
  const categories = catResponse.data || [];
  const allPages = pagesResponse.data || [];
  // Pages directly under the menu item (no category)
  const directPages = allPages.filter((p) => !p.menuCategoryId);

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
          <div className="admin-breadcrumb">
            <Link href="/admin/menu" className="admin-breadcrumb-link">
              ← Menu Items
            </Link>
          </div>
          <h1>Edit: {menuItem.title}</h1>
        </div>
      </div>

      {/* Edit form */}
      <MenuItemEditor menuItem={menuItem} />

      {/* ── Categories ─────────────────────────────────────────── */}
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Categories</h2>
        <Link
          href={`/admin/menu/${id}/categories/new`}
          className="admin-btn-save"
        >
          {plusIcon}
          New Category
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
                  No categories yet. Add the first one or add a page directly
                  below.
                </td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id}>
                <td style={{ fontWeight: 600 }}>{cat.title}</td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        cat.status === "published" ? "#dcfce7" : "#fef9c3",
                      color: cat.status === "published" ? "#166534" : "#854d0e",
                    }}
                  >
                    {cat.status ?? "draft"}
                  </span>
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
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Direct Pages (no category) ──────────────────────────── */}
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Pages (direct)</h2>
        <Link href={`/admin/menu/${id}/pages/new`} className="admin-btn-save">
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
              <th>Category</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allPages.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-state">
                  No pages yet. Add a direct page or add pages inside a
                  category.
                </td>
              </tr>
            )}
            {allPages.map((page) => (
              <tr key={page.id}>
                <td style={{ fontWeight: 600 }}>{page.title}</td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.875rem" }}>
                  {page.slug}
                </td>
                <td>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        page.status === "published" ? "#dcfce7" : "#fef9c3",
                      color:
                        page.status === "published" ? "#166534" : "#854d0e",
                    }}
                  >
                    {page.status}
                  </span>
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.875rem" }}>
                  {page.menuCategoryId ? (
                    (categories.find((c) => c.id === page.menuCategoryId)
                      ?.title ?? page.menuCategoryId)
                  ) : (
                    <em>direct</em>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/menu/pages/${page.id}/edit`}
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

      {directPages.length > 0 && (
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--sb-muted)",
            marginTop: "0.5rem",
          }}
        >
          {directPages.length} page(s) attached directly to this menu item (no
          category).
        </p>
      )}
    </div>
  );
}
