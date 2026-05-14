/**
 * Menu Manager - Admin
 * Dedicated manager for top-level menu ordering and quick visibility controls.
 */

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import AdminMenuManager from "@/components/AdminMenuManager";
import { menuLocationOptions } from "@/lib/menuLocations";

export default async function AdminMenuManagerPage() {
  const { service } = await getAdminApiService();

  const [menuItemsResponse, ...menuLayoutResponses] = await Promise.all([
    service.getMenuItems(),
    ...menuLocationOptions.map((option) =>
      service.getMenuLayoutSettings(option.key),
    ),
  ]);

  const menuItems = menuItemsResponse.data || [];
  const initialLayouts = Object.fromEntries(
    menuLocationOptions.map((option, index) => {
      const response = menuLayoutResponses[index];
      return [
        option.key,
        response?.statusCode === 200 ? (response.data ?? null) : null,
      ];
    }),
  );
  const breadcrumbItems = [{ href: "/cms", label: "Dashboard" }];

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <AdminBreadcrumbs items={breadcrumbItems} />
          <div className="admin-page-eyebrow">Navigation layout</div>
          <h1>Menu Manager</h1>
          <p className="admin-page-description">
            Add, hide, delete, and reorder top-level menu items separately for
            the site navigation and the footer links column.
          </p>
        </div>
      </div>

      <AdminMenuManager menuItems={menuItems} initialLayouts={initialLayouts} />

      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
