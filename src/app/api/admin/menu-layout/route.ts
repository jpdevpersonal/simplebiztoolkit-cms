import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const menuKey = request.nextUrl.searchParams.get("menuKey");
  const qs = menuKey ? `?menuKey=${encodeURIComponent(menuKey)}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/admin/menu-layout${qs}`,
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request,
    path: "/api/admin/menu-layout",
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });
}
