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
        <h1>Product Categories</h1>
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

      {/* Category grid */}
      {categories.length === 0 ? (
        <div className="admin-card p-4 text-center">
          <p style={{ color: "var(--sb-muted)", marginBottom: 0 }}>
            No categories found. Create your first category!
          </p>
        </div>
      ) : (
        <div className="row g-3">
          {categories.map((category) => (
            <div key={category.id} className="col-md-6">
              <div
                className="admin-card p-4 h-100"
                style={{ display: "flex", flexDirection: "column" }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <h3
                      style={{ fontWeight: 600, fontSize: "1rem", margin: 0 }}
                    >
                      {category.name}
                    </h3>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--sb-muted)",
                        background: "#f1f3f5",
                        borderRadius: "999px",
                        padding: "0.15rem 0.6rem",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {category.items?.length || 0} products
                    </span>
                  </div>
                  {category.summary && (
                    <p
                      style={{
                        color: "var(--sb-muted)",
                        fontSize: "0.875rem",
                        marginBottom: "1rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {category.summary}
                    </p>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "0.75rem",
                  }}
                >
                  <Link
                    href={`/admin/categories/${category.id}/edit`}
                    className="admin-btn-save"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/products/${category.slug}`}
                    className="admin-btn-cancel"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Live
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
