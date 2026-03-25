import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request: null,
    path: "/api/admin/images",
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  return proxyToBackend({
    request,
    path: "/api/admin/images",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });
}
