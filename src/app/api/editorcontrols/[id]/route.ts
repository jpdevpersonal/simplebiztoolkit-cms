/**
 * Editor Controls API proxy (single record)
 * GET    – fetch by id
 * PUT    – update (requires authentication)
 * DELETE – delete (requires authentication)
 *
 * Dev-only in-memory fallback mirrors the collection route.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

// Shared dev-only in-memory store (same Node process as the collection route).
import { devStore } from "../_devStore";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const backendRes = await proxyToBackend({
    request: null,
    path: `/api/editorcontrols/${id}`,
    method: "GET",
  });

  if (backendRes.status === 404) {
    const item = devStore.find((c) => c.id === id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: item });
  }

  return backendRes;
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;
  const bodyText = await request.text();

  const backendRes = await proxyToBackend({
    request: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyText || undefined,
    }),
    path: `/api/editorcontrols/${id}`,
    method: "PUT",
    accessToken: authResult.auth.accessToken,
  });

  if (backendRes.status === 404) {
    try {
      const payload = bodyText ? JSON.parse(bodyText) : {};
      const idx = devStore.findIndex((c) => c.id === id);
      if (idx === -1) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const updated = {
        ...devStore[idx],
        ...payload,
        id, // preserve id
        updatedAt: new Date().toISOString(),
      };
      devStore[idx] = updated;
      return NextResponse.json({ data: updated });
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  return backendRes;
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await context.params;

  const backendRes = await proxyToBackend({
    request: null,
    path: `/api/editorcontrols/${id}`,
    method: "DELETE",
    accessToken: authResult.auth.accessToken,
  });

  if (backendRes.status === 404) {
    const idx = devStore.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    devStore.splice(idx, 1);
    return NextResponse.json({ data: null });
  }

  return backendRes;
}
