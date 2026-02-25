/**
 * Edit Menu Item Page - Admin
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
            {" / "}
            <Link
              href={`/admin/menu/categories/${page.menuCategoryId}/pages`}
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              Pages
            </Link>
          </div>
          <h1>Edit: {page.title}</h1>
        </div>
      </div>
      <MenuItemPageEditor page={page} menuCategoryId={page.menuCategoryId} />
    </div>
  );
}
