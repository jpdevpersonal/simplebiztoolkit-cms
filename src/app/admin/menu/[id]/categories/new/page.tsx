/**
 * New Category Page - Admin
 * Creates a new MenuCategory under the given menu item
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
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

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/menu" className="admin-breadcrumb-link">
              ← Menu Items
            </Link>
            {" / "}
            <Link
              href={`/admin/menu/${menuItemId}/edit`}
              className="admin-breadcrumb-link"
            >
              {menuItem.title}
            </Link>
          </div>
          <h1>New Topic</h1>
        </div>
      </div>
      <MenuCategoryEditor menuItemId={menuItemId} isNew />
    </div>
  );
}
