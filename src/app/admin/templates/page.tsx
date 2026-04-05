/**
 * Products List Page - Admin
 * Lists all products across categories
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminProductsTable from "../../../components/AdminProductsTable";
import AdminStatCard from "@/components/AdminStatCard";

export default async function ProductsPage() {
  const { service } = await getAdminApiService();

  const response = await service.getAllProducts();
  const categories = response.data || [];
  const products = categories.flatMap((cat) => cat.items || []);

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Offer library</div>
          <h1>Templates</h1>
          <p className="admin-page-description">
            Keep product templates aligned, readable, and easy to manage across
            categories.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">
            {categories.length} categories
          </span>
          <Link href="/admin/templates/new" className="admin-btn-save">
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
            New Template
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6">
          <AdminStatCard
            label="Total Templates"
            value={products.length}
            valueSize="lg"
          />
        </div>
        <div className="col-12 col-md-6">
          <AdminStatCard
            label="Categories"
            value={categories.length}
            valueSize="lg"
          />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">Catalog</div>
            <h2 className="admin-section-card-title">Template catalog</h2>
            <p className="admin-section-card-copy">
              Compare category, price, and status at a glance, then jump into
              edit mode or preview where available.
            </p>
          </div>
        </div>
        <AdminProductsTable products={products} categories={categories} />
      </section>
    </div>
  );
}
