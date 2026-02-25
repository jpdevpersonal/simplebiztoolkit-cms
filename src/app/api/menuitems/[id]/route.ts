/**
 * Menu Items API proxy (single record)
 * GET    – fetch by id
 * PUT    – update (requires authentication)
 * DELETE – delete (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const authResult = await requireAuth();
  return proxyToBackend({
    request: null,
    path: `/api/menuitems/${id}`,
    method: "GET",
    accessToken: authResult.ok ? authResult.auth.accessToken : undefined,
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
    path: `/api/menuitems/${id}`,
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
    path: `/api/menuitems/${id}`,
    method: "DELETE",
    accessToken: authResult.auth.accessToken,
  });
}
