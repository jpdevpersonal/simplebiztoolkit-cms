import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { name } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/admin/stats/${encodeURIComponent(name)}`,
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ name: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { name } = await context.params;
  return proxyToBackend({
    request,
    path: `/api/admin/stats/${encodeURIComponent(name)}`,
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });
}
