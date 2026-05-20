/**
 * Edit Category Page – Admin
 * Shows the category edit form and the pages belonging to this category.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuCategoryEditor from "@/components/MenuCategoryEditor";

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
    <div>
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
      <div
        className="admin-page-header mt-4"
        style={{
          borderTop: "1px solid var(--sb-border)",
          paddingTop: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
          Pages in this Topic
        </h2>
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
