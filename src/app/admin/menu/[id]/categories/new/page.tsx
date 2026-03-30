/**
 * New Category Page - Admin
 * Creates a new MenuCategory under the given menu item
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminBreadcrumbs from "@/components/AdminBreadcrumbs";
import MenuCategoryEditor from "@/components/MenuCategoryEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewMenuCategoryPage({ params }: Props) {
  const { id: menuItemId } = await params;
  const { service } = await getAdminApiService();

  const itemResponse = await service.getMenuItemById(menuItemId);
  if (!itemResponse.data) return notFound();

  const menuItem = itemResponse.data;
  const breadcrumbItems = [
    { href: "/admin/menu", label: "Menu Items" },
    { href: `/admin/menu/${menuItemId}/edit`, label: menuItem.title },
  ];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <AdminBreadcrumbs items={breadcrumbItems} />
          <h1>New Topic</h1>
        </div>
      </div>
      <MenuCategoryEditor menuItemId={menuItemId} isNew />
      <div className="admin-page-footer-link">
        <AdminBreadcrumbs
          items={breadcrumbItems}
          ariaLabel="Breadcrumb footer"
        />
      </div>
    </div>
  );
}
