/**
 * Articles API proxy (per-id)
 * - GET to fetch a single article by ID (requires authentication for drafts)
 * - PUT to update an article (requires authentication)
 * - DELETE to remove an article (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Allow unauthenticated GETs for published articles, but pass the
  // access token when available so drafts can be retrieved server-side.
  const authResult = await requireAuth();
  const { id } = await context.params;
  return proxyToBackend({
    request: null,
    path: `/api/articles/${id}`,
    method: "GET",
    accessToken: authResult.ok ? authResult.auth.accessToken : undefined,
  });
}

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
    path: `/api/articles/${id}`,
    method: "PUT",
    accessToken: authResult.auth.accessToken,
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
    path: `/api/articles/${id}`,
    method: "DELETE",
    accessToken: authResult.auth.accessToken,
  });
}
