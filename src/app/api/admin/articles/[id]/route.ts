import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/admin/articles/${id}`,
    method: "GET",
    accessToken: authResult.auth.accessToken,
  });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  return proxyToBackend({
    request,
    path: `/api/admin/articles/${id}`,
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/admin/articles/${id}`,
    method: "DELETE",
    accessToken: authResult.auth.accessToken,
  });
}
