/**
 * Menu Categories API proxy (collection)
 * GET  – list categories, optionally filtered by ?menuItemId= (public)
 * POST – create a category (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const menuItemId = request.nextUrl.searchParams.get("menuItemId");
  const qs = menuItemId ? `?menuItemId=${menuItemId}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/menucategories${qs}`,
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
    path: "/api/menucategories",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
