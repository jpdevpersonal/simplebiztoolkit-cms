/**
 * Menu Manager - Admin
 * Dedicated manager for top-level menu ordering and quick visibility controls.
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminMenuManager from "@/components/AdminMenuManager";

export default async function AdminMenuManagerPage() {
  const { service } = await getAdminApiService();

  const [menuItemsResponse, menuLayoutResponse] = await Promise.all([
    service.getMenuItems(),
    service.getMenuLayoutSettings("primary"),
  ]);

  const menuItems = menuItemsResponse.data || [];
  const initialLayout =
    menuLayoutResponse.statusCode === 200
      ? (menuLayoutResponse.data ?? null)
      : null;

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-breadcrumb">
            <Link href="/admin" className="admin-breadcrumb-link">
              ← Dashboard
            </Link>
          </div>
          <div className="admin-page-eyebrow">Navigation layout</div>
          <h1>Menu Manager</h1>
          <p className="admin-page-description">
            Add, hide, delete, and reorder top-level menu items for the primary
            site navigation.
          </p>
        </div>
      </div>

      <AdminMenuManager menuItems={menuItems} initialLayout={initialLayout} />
    </div>
  );
}
