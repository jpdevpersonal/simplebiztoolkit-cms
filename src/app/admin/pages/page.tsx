/**
 * Pages List – Admin
 * Global view of all menu-item pages with filtering by menu item and category.
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

export default async function AdminPagesListPage() {
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  // Fetch all menu items + categories + pages
  const [menuRes, categoriesRes, pagesRes] = await Promise.all([
    service.getMenuItems(),
    service.getMenuCategories(),
    service.getMenuItemPages(),
  ]);

  const menuItems = menuRes.data || [];
  const allCategories = categoriesRes.data || [];
  const allPages = pagesRes.data || [];

  // Build a lookup for menu item titles and category titles
  const menuItemMap = new Map(menuItems.map((item) => [item.id, item.title]));
  const categoryMap = new Map(
    allCategories.map((category) => [
      category.id,
      {
        title: category.title,
        menuItemId: category.menuItemId,
      },
    ]),
  );

  // Enrich pages with parent names
  const enrichedPages = allPages.map((page) => {
    let menuItemTitle = "—";
    let categoryTitle: string | null = null;
    let menuItemId: string | null = null;

    if (page.menuCategoryId && categoryMap.has(page.menuCategoryId)) {
      const cat = categoryMap.get(page.menuCategoryId)!;
      categoryTitle = cat.title;
      menuItemId = cat.menuItemId;
      menuItemTitle = menuItemMap.get(cat.menuItemId) ?? "—";
    } else if (page.menuItemId && menuItemMap.has(page.menuItemId)) {
      menuItemTitle = menuItemMap.get(page.menuItemId)!;
      menuItemId = page.menuItemId;
    }

    return { ...page, menuItemTitle, categoryTitle, menuItemId };
  });

  const published = enrichedPages.filter((p) => p.status === "published");
  const drafts = enrichedPages.filter((p) => p.status === "draft");

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
        <h1>Pages</h1>
        <Link href="/admin/pages/new" className="admin-btn-save">
          {plusIcon}
          New Page
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <AdminStatCard label="Total Pages" value={enrichedPages.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Published" value={published.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Drafts" value={drafts.length} />
        </div>
      </div>

      {/* Pages table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Menu Item</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrichedPages.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty-state">
                  No pages found. Create your first page!
                </td>
              </tr>
            )}
            {enrichedPages.map((page) => (
              <tr key={page.id}>
                <td style={{ fontWeight: 600 }}>{page.title}</td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.85rem",
                    fontFamily: "monospace",
                    maxWidth: "140px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {page.slug}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {page.menuItemTitle}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {page.categoryTitle ?? (
                    <span style={{ fontStyle: "italic", opacity: 0.5 }}>
                      None
                    </span>
                  )}
                </td>
                <td>
                  <StatusBadge status={page.status} />
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.85rem" }}>
                  {page.dateISO}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <Link
                      href={`/admin/pages/${page.id}/edit`}
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
                        title="Preview on site"
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
    </div>
  );
}
