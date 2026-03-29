/**
 * Menu layout settings API proxy (public)
 * GET - fetch layout settings for a given menu key.
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const menuKey = request.nextUrl.searchParams.get("menuKey");
  const qs = menuKey ? `?menuKey=${encodeURIComponent(menuKey)}` : "";

  return proxyToBackend({
    request: null,
    path: `/api/menu-layout${qs}`,
    method: "GET",
  });
}
