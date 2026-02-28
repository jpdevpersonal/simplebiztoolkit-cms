/**
 * New Page directly under a Menu Item (no category required) – Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuItemPageEditor from "@/components/MenuItemPageEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewDirectPagePage({ params }: Props) {
  await headers();
  const { id: menuItemId } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const [itemResponse, catResponse] = await Promise.all([
    service.getMenuItemById(menuItemId),
    service.getMenuCategories(menuItemId),
  ]);

  if (!itemResponse.data) return notFound();

  const menuItem = itemResponse.data;
  const categories = catResponse.data || [];

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
          <h1>New Page</h1>
        </div>
      </div>
      <MenuItemPageEditor
        menuItemId={menuItemId}
        categories={categories}
        isNew
      />
    </div>
  );
}
