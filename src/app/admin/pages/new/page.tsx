/**
 * New Page – Admin
 * Create a new page with menu item + category selection.
 * Supports ?menuItemId= and ?categoryId= query params for pre-selection.
 */

import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import PageEditor from "../PageEditor";

type Props = {
  searchParams: Promise<{ menuItemId?: string; categoryId?: string }>;
};

export default async function NewPageAdminPage({ searchParams }: Props) {
  await headers();
  const { menuItemId, categoryId } = await searchParams;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

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
