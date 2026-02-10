/**
 * Products List Page - Admin
 * Lists all products across categories
 */

import Link from "next/link";
import { apiService } from "@/lib/api";

export default async function ProductsPage() {
  const response = await apiService.getProductCategories();
  const categories = response.data || [];
  const products = categories.flatMap((cat) => cat.items || []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontWeight: 700 }}>Products</h1>
        <Link href="/admin/products/new" className="btn sb-btn-primary">
          + New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Total Products
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {products.length}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Categories
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {categories.length}
            </div>
          </div>
        </div>
      </div>

      {/* Product Table */}
      <div className="sb-card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 sb-muted">
                    No products found. Create your first product!
                  </td>
                </tr>
              )}
              {products.map((product) => {
                const category = categories.find((cat) =>
                  cat.items?.includes(product),
                );
                return (
                  <tr key={product.id}>
                    <td style={{ fontWeight: 600 }}>{product.title}</td>
                    <td>{category?.name}</td>
                    <td>{product.price}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            product.status === "published"
                              ? "var(--sb-success)"
                              : "var(--sb-warning)",
                          color: "#fff",
                        }}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="btn btn-sm sb-btn-ghost"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
