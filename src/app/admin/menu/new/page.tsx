/**
 * New Menu Item Page - Admin
 */

import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuItemEditor from "@/components/MenuItemEditor";

export default function NewMenuItemPage() {
  const breadcrumbItems = [{ href: "/cms/menu", label: "Menu Items" }];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New Menu Item</h1>
        </div>
      </div>
      <MenuItemEditor isNew />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
