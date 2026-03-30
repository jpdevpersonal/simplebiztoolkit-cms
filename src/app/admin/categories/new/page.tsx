/**
 * New Category Page
 */

import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import CategoryEditor from "@/components/CategoryEditor";

export default function NewCategoryPage() {
  const breadcrumbItems = [{ href: "/admin/categories", label: "Categories" }];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New Category</h1>
        </div>
      </div>
      <CategoryEditor isNew />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
