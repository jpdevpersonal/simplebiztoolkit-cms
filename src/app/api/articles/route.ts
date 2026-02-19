/**
 * Articles API proxy (collection)
 * - GET to list articles (passes auth token when available for draft access)
 * - POST to create a new article (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();

  return proxyToBackend({
    request,
    path: "/api/articles",
    method: "GET",
    accessToken: authResult.ok ? authResult.auth.accessToken : undefined,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  return proxyToBackend({
    request,
    path: "/api/articles",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
