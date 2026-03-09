/**
 * New Page – Admin
 * Create a new page with menu item + category selection.
 * Supports ?menuItemId= and ?categoryId= query params for pre-selection.
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import PageEditor from "../PageEditor";

type Props = {
  searchParams: Promise<{ menuItemId?: string; categoryId?: string }>;
};

export default async function NewPageAdminPage({ searchParams }: Props) {
  const { menuItemId, categoryId } = await searchParams;
  const { service } = await getAdminApiService();

  const menuRes = await service.getMenuItems();
  const menuItems = menuRes.data || [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/pages" className="admin-breadcrumb-link">
              ← Pages
            </Link>
          </div>
          <h1>New Page</h1>
        </div>
      </div>
      <PageEditor
        menuItems={menuItems}
        initialMenuItemId={menuItemId}
        initialCategoryId={categoryId}
        isNew
      />
    </div>
  );
}
