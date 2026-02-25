/**
 * Edit Menu Item Page - Admin
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { apiService, getApiService } from "@/lib/api";
import type { Session } from "next-auth";
import MenuItemEditor from "@/components/MenuItemEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditMenuItemPage({ params }: Props) {
  await headers();
  const { id } = await params;
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getMenuItemById(id);
  if (!response.data) return notFound();

  const menuItem = response.data;

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
          </div>
          <h1>Edit: {menuItem.title}</h1>
        </div>
      </div>
      <MenuItemEditor menuItem={menuItem} />
    </div>
  );
}
