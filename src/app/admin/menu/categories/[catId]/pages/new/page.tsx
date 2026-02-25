/**
 * New Menu Item Page - Admin
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
              href={`/admin/menu/categories/${catId}/pages`}
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              {category.title}
            </Link>
          </div>
          <h1>New Page</h1>
        </div>
      </div>
      <MenuItemPageEditor menuCategoryId={catId} isNew />
    </div>
  );
}
