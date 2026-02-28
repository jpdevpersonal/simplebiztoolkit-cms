/**
 * Pages list for a specific Menu Category - Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import AdminStatCard from "@/components/AdminStatCard";

interface Props {
  params: Promise<{ catId: string }>;
}

export default async function MenuCategoryPagesPage({ params }: Props) {
  await headers();
  const { catId } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const [catResponse, pagesResponse] = await Promise.all([
    service.getMenuCategoryById(catId),
    service.getMenuItemPages(catId),
  ]);

  if (!catResponse.data) return notFound();

  const category = catResponse.data;
  const pages = pagesResponse.data || [];
  const published = pages.filter((p) => p.status === "published");
  const drafts = pages.filter((p) => p.status === "draft");

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/menu" className="admin-breadcrumb-link">
              ← Menu Items
            </Link>
            {" / "}
            <Link
              href={`/admin/menu/${category.menuItemId}/categories`}
              className="admin-breadcrumb-link"
            >
              Categories
            </Link>
            {" / "}
            <Link
              href={`/admin/menu/categories/${catId}/edit`}
              className="admin-breadcrumb-link"
            >
              {category.title}
            </Link>
          </div>
          <h1>Pages</h1>
        </div>
        <Link
          href={`/admin/menu/categories/${catId}/pages/new`}
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
          New Page
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <AdminStatCard label="Total" value={pages.length} />
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
                <td style={{ fontWeight: 600 }}>{page.title}</td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.875rem",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
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
                  {page.dateISO}
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
    </div>
  );
}
