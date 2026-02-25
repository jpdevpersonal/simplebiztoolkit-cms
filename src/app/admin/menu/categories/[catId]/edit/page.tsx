/**
 * Edit Category Page - Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuCategoryEditor from "@/components/MenuCategoryEditor";

interface Props {
  params: Promise<{ catId: string }>;
}

export default async function EditMenuCategoryPage({ params }: Props) {
  await headers();
  const { catId } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getMenuCategoryById(catId);
  if (!response.data) return notFound();

  const category = response.data;

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
              href={`/admin/menu/${category.menuItemId}/categories`}
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              Categories
            </Link>
          </div>
          <h1>Edit: {category.title}</h1>
        </div>
      </div>
      <MenuCategoryEditor
        category={category}
        menuItemId={category.menuItemId}
      />
    </div>
  );
}
