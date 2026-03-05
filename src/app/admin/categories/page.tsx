/**
 * Categories List Page - Admin
 * Lists all product categories
 */

import Link from "next/link";
import { apiService } from "@/lib/api";

export default async function CategoriesPage() {
  const response = await apiService.getProductCategories();
  const categories = response.data || [];

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Template Categories</h1>
        <Link href="/admin/categories/new" className="admin-btn-save">
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
          New Category
        </Link>
      </div>

      {/* Category table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Templates</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-state">
                  No categories found. Create your first category!
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id}>
                <td style={{ fontWeight: 600 }}>{category.name}</td>
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
                  {category.slug}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {category.items?.length || 0}
                </td>
                <td>
                  <Link
                    href={`/products/${category.slug}`}
                    className="admin-btn-action"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginLeft: "0.25rem" }}
                    >
                      <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="15 3 21 3 21 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="10"
                        y1="14"
                        x2="21"
                        y2="3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Link>
                </td>
                <td>
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
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
