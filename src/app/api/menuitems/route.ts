/**
 * Menu Items API proxy (collection)
 * GET  – list all menu items, optionally filtered by ?status= (public)
 * POST – create a menu item (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return proxyToBackend({
    request: null,
    path: `/api/menuitems${qs}`,
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const bodyText = await request.text();
  return proxyToBackend({
    // Create a regular Request with the same body so proxyToBackend can
    // forward it. Next's Request is compatible at runtime.
    request: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyText || undefined,
    }),
    path: "/api/menuitems",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
