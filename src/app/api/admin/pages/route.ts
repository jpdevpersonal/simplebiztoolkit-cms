import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const params = new URLSearchParams();
  const menuItemId = request.nextUrl.searchParams.get("menuItemId");
  const menuCategoryId = request.nextUrl.searchParams.get("menuCategoryId");
  const status = request.nextUrl.searchParams.get("status");

  if (menuItemId) params.set("menuItemId", menuItemId);
  if (menuCategoryId) params.set("menuCategoryId", menuCategoryId);
  if (status) params.set("status", status);

  const qs = params.toString() ? `?${params.toString()}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/admin/pages${qs}`,
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request,
    path: "/api/admin/pages",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
