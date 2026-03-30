/**
 * New Product Page
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import ProductEditor from "@/components/ProductEditor";

export default async function NewProductPage() {
  const { service } = await getAdminApiService();
  const categoriesResponse = await service.getProductCategories();
  const categories = categoriesResponse.data || [];
  const breadcrumbItems = [{ href: "/admin/products", label: "Templates" }];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New Template</h1>
        </div>
      </div>
      <ProductEditor categories={categories} />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
