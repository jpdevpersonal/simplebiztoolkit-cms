/**
 * Edit Menu Item Page – Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuItemPageEditor from "@/components/MenuItemPageEditor";

interface Props {
  params: Promise<{ pageId: string }>;
}

export default async function EditMenuItemPagePage({ params }: Props) {
  await headers();
  const { pageId } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getMenuItemPageById(pageId);
  if (!response.data) return notFound();

  const page = response.data;

  // Resolve the parent menu item id (might come from a category or directly)
  const menuItemId =
    page.menuItemId ??
    (page.menuCategoryId
      ? (await service.getMenuCategoryById(page.menuCategoryId)).data
          ?.menuItemId
      : undefined);

  // Load that menu item's categories for the reassignment dropdown
  const categories = menuItemId
    ? ((await service.getMenuCategories(menuItemId)).data ?? [])
    : [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--sb-muted)",
              marginBottom: "0.25rem",
            }}
          >
            <Link
              href="/admin/menu"
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              ← Menu Items
            </Link>
            {menuItemId && (
              <>
                {" / "}
                <Link
                  href={`/admin/menu/${menuItemId}/edit`}
                  style={{ color: "var(--sb-muted)", textDecoration: "none" }}
                >
                  Menu Item
                </Link>
              </>
            )}
            {page.menuCategoryId && (
              <>
                {" / "}
                <Link
                  href={`/admin/menu/categories/${page.menuCategoryId}/edit`}
                  style={{ color: "var(--sb-muted)", textDecoration: "none" }}
                >
                  Category
                </Link>
              </>
            )}
          </div>
          <h1>Edit: {page.title}</h1>
        </div>
      </div>
      <MenuItemPageEditor
        page={page}
        menuItemId={menuItemId ?? ""}
        menuCategoryId={page.menuCategoryId}
        categories={categories}
      />
    </div>
  );
}

