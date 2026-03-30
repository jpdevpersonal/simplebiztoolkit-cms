/**
 * Edit Category Page
 */

import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import CategoryEditor from "@/components/CategoryEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;

  const { service } = await getAdminApiService();
  const response = await service.getProductCategories();
  const categories = response.data || [];

  const category = categories.find((c) => c.id === id);
  const breadcrumbItems = [{ href: "/admin/categories", label: "Categories" }];

  if (!category) {
    notFound();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>Edit Category</h1>
        </div>
        <span className="admin-page-meta admin-page-meta-lg">
          {category.name}
        </span>
      </div>
      <CategoryEditor category={category} />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
