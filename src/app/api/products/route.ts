/**
 * Products API proxy (collection)
 * - POST to create a new product (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  return proxyToBackend({
    request,
    path: "/api/products",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
