/**
 * Edit Category Page – Admin
 * Shows the category edit form and the pages belonging to this category.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuCategoryEditor from "@/components/MenuCategoryEditor";

interface Props {
  params: Promise<{ catId: string }>;
}

export default async function EditMenuCategoryPage({ params }: Props) {
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
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/menu" className="admin-breadcrumb-link">
              ← Menu Items
            </Link>
            {" / "}
            <Link
              href={`/admin/menu/${category.menuItemId}/edit`}
              className="admin-breadcrumb-link"
            >
              Menu Item
            </Link>
          </div>
          <h1>Edit Category: {category.title}</h1>
        </div>
      </div>

      {/* Category edit form */}
      <MenuCategoryEditor
        category={category}
        menuItemId={category.menuItemId}
      />

      {/* ── Pages in this Category ─────────────────────────────── */}
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          Pages in this Category
        </h2>
        <Link
          href={`/admin/menu/categories/${catId}/pages/new`}
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
