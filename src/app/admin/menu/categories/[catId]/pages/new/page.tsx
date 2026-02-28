/**
 * New Page under a Category – Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuItemPageEditor from "@/components/MenuItemPageEditor";

interface Props {
  params: Promise<{ catId: string }>;
}

export default async function NewMenuItemPagePage({ params }: Props) {
  await headers();
  const { catId } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const catResponse = await service.getMenuCategoryById(catId);
  if (!catResponse.data) return notFound();

  const category = catResponse.data;

  // Load sibling categories so the user can re-assign if needed
  const catListResponse = await service.getMenuCategories(category.menuItemId);
  const categories = catListResponse.data || [];

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
              href={`/admin/menu/${category.menuItemId}/edit`}
              className="admin-breadcrumb-link"
            >
              Menu Item
            </Link>
            {" / "}
            <Link
              href={`/admin/menu/categories/${catId}/edit`}
              className="admin-breadcrumb-link"
            >
              {category.title}
            </Link>
          </div>
          <h1>New Page</h1>
        </div>
      </div>
      <MenuItemPageEditor
        menuItemId={category.menuItemId}
        menuCategoryId={catId}
        categories={categories}
        isNew
      />
    </div>
  );
}
