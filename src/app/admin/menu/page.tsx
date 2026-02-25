/**
 * Menu Items List Page - Admin
 * Lists all navigation menu items with their categories
 */

import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import AdminStatCard from "@/components/AdminStatCard";

export default async function MenuPage() {
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getMenuItems();
  const menuItems = response.data || [];

  const totalCategories = menuItems.reduce(
    (sum, item) => sum + (item.categories?.length ?? 0),
    0,
  );
  const totalPages = menuItems.reduce(
    (sum, item) =>
      sum +
      (item.categories?.reduce(
        (cSum, cat) => cSum + (cat.pages?.length ?? 0),
        0,
      ) ?? 0),
    0,
  );

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
          <AdminStatCard label="Categories" value={totalCategories} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Pages" value={totalPages} />
        </div>
      </div>

      {/* Menu items table */}
      <div className="admin-table-wrap">
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
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background:
                        item.status === "published" ? "#dcfce7" : "#fef9c3",
                      color:
                        item.status === "published" ? "#166534" : "#854d0e",
                    }}
                  >
                    {item.status ?? "draft"}
                  </span>
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
    </div>
  );
}
