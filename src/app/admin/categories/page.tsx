/**
 * Categories List Page - Admin
 * Lists all product categories.
 */

import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminCategoriesTable from "@/components/AdminCategoriesTable";
import AdminStatCard from "@/components/AdminStatCard";

export default async function CategoriesPage() {
  const { service } = await getAdminApiService();
  const response = await service.getProductCategories();
  const categories = response.data || [];
  const templateCount = categories.reduce(
    (total, category) => total + (category.items?.length || 0),
    0,
  );

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Catalog structure</div>
          <h1>Template Categories</h1>
          <p className="admin-page-description">
            Organize templates into clear collections and review their public
            category pages.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">{templateCount} templates</span>
          <Link href="/cms/categories/new" className="admin-btn-save">
            <Plus size={16} aria-hidden="true" />
            New Category
          </Link>
        </div>
      </div>

      <div className="row g-3 mb-1">
        <div className="col-6">
          <AdminStatCard label="Categories" value={categories.length} />
        </div>
        <div className="col-6">
          <AdminStatCard label="Templates" value={templateCount} />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">Collections</div>
            <h2 className="admin-section-card-title">All categories</h2>
            <p className="admin-section-card-copy">
              Find a category by name or slug, then open its editor or public
              preview.
            </p>
          </div>
        </div>
        <AdminCategoriesTable categories={categories} />
      </section>
    </div>
  );
}
