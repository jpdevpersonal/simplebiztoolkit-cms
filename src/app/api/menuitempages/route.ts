/**
 * Menu Item Pages API proxy (collection)
 * GET  – list pages, optionally filtered by ?menuCategoryId= and ?status= (public)
 * POST – create a page (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const params = new URLSearchParams();
  const menuCategoryId = request.nextUrl.searchParams.get("menuCategoryId");
  const status = request.nextUrl.searchParams.get("status");
  if (menuCategoryId) params.set("menuCategoryId", menuCategoryId);
  if (status) params.set("status", status);
  const qs = params.toString() ? `?${params.toString()}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/menuitempages${qs}`,
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  return proxyToBackend({
    request,
    path: "/api/menuitempages",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
