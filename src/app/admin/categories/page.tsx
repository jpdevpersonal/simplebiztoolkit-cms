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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontWeight: 700 }}>Product Categories</h1>
        <Link href="/admin/categories/new" className="btn sb-btn-primary">
          + New Category
        </Link>
      </div>

      {/* Category Cards */}
      <div className="row g-3">
        {categories.map((category) => (
          <div key={category.id} className="col-md-6">
            <div className="sb-card p-4">
              <h3 style={{ fontWeight: 600 }}>{category.name}</h3>
              <p className="sb-muted">{category.summary}</p>
              <div className="sb-muted mb-3" style={{ fontSize: "0.875rem" }}>
                {category.items?.length || 0} products
              </div>
              <div className="d-flex gap-2">
                <Link
                  href={`/admin/categories/${category.id}/edit`}
                  className="btn btn-sm sb-btn-primary"
                >
                  Edit Category
                </Link>
                <Link
                  href={`/products/${category.slug}`}
                  className="btn btn-sm sb-btn-ghost"
                  target="_blank"
                >
                  View Live
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="sb-card p-4 text-center">
          <p className="sb-muted mb-0">
            No categories found. Create your first category!
          </p>
        </div>
      )}
    </div>
  );
}
