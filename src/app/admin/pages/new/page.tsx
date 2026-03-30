/**
 * New Page – Admin
 * Create a new page with menu item + category selection.
 * Supports ?menuItemId= and ?categoryId= query params for pre-selection.
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import PageEditor from "../PageEditor";

type Props = {
  searchParams: Promise<{ menuItemId?: string; categoryId?: string }>;
};

export default async function NewPageAdminPage({ searchParams }: Props) {
  const { menuItemId, categoryId } = await searchParams;
  const { service } = await getAdminApiService();
  const breadcrumbItems = [{ href: "/admin/pages", label: "Pages" }];

  const menuRes = await service.getMenuItems();
  const menuItems = menuRes.data || [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New Page</h1>
        </div>
      </div>
      <PageEditor
        menuItems={menuItems}
        initialMenuItemId={menuItemId}
        initialCategoryId={categoryId}
        isNew
      />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
