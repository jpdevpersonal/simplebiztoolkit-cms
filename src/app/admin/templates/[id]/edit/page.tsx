/**
 * Edit Product Page
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import ProductEditor from "@/components/ProductEditor";
import ProductEditorLoader from "@/components/ProductEditorLoader";

type Props = {
  params: Promise<{ id: string }>;
};

function PageHeader({ id }: { id: string }) {
  const breadcrumbItems = [{ href: "/admin/templates", label: "Templates" }];

  return (
    <div className="admin-page-header">
      <div>
        <AdminBreadcrumbs items={breadcrumbItems} />
        <h1>Edit Template</h1>
      </div>
      <span className="admin-page-meta">ID: {id}</span>
    </div>
  );
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const breadcrumbItems = [{ href: "/admin/templates", label: "Templates" }];

  const { service } = await getAdminApiService();

  const categoriesResponse = await service.getProductCategories();
  const categories = categoriesResponse.data || [];

  const response = await service.getProductById(id);
  let product = response.data;

  if (!product) {
    product = categories
      .flatMap((category) => category.items || [])
      .find((item) => item.id === id);
  }

  if (!product) {
    return (
      <div>
        <PageHeader id={id} />
        <ProductEditorLoader id={id} />
        <div className="admin-page-footer-link">
          <AdminBreadcrumbs
            items={breadcrumbItems}
            ariaLabel="Breadcrumb footer"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader id={id} />
      <ProductEditor product={product} categories={categories} />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
