import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const menuItemId = request.nextUrl.searchParams.get("menuItemId");
  const qs = menuItemId ? `?menuItemId=${encodeURIComponent(menuItemId)}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/admin/menucategories${qs}`,
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request,
    path: "/api/admin/menucategories",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
