/**
 * Products API proxy (per-id)
 * - Allows PUT to update a product but requires an authenticated NextAuth session
 * - Proxies other methods to the backend
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;
  return proxyToBackend({
    request,
    path: `/api/products/${id}`,
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/products/${id}`,
    method: "GET",
  });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  const { id } = await context.params;

  return proxyToBackend({
    request: null,
    path: `/api/products/${id}`,
    method: "DELETE",
    accessToken: authResult.auth.accessToken,
  });
}
