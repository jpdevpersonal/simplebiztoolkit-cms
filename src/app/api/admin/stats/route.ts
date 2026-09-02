import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request: null,
    path: "/api/admin/stats",
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function PUT(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request,
    path: "/api/admin/stats",
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });
}
