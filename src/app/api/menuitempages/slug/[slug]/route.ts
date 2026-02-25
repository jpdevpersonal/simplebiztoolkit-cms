/**
 * Menu Item Pages API proxy (lookup by slug)
 * GET – fetch a published page by its slug (public)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/apiProxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/menuitempages/slug/${slug}`,
    method: "GET",
  });
}
