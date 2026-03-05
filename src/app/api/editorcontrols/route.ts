/**
 * Editor Controls API proxy (collection)
 * GET  – list all controls, optionally filtered by ?status= (public)
 * POST – create a control (requires authentication)
 *
 * When the C# backend returns 404 we maintain a module-scope in-memory
 * store so the admin UI can work in local development.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";
import type { EditorControlPreset } from "@/types/editorControls";
import { devStore, generateId } from "./_devStore";

// ── Handlers ─────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";

  const backendRes = await proxyToBackend({
    request: null,
    path: `/api/editorcontrols${qs}`,
    method: "GET",
  });

  if (backendRes.status === 404) {
    const filtered = status
      ? devStore.filter((c) => c.status === status)
      : devStore;
    return NextResponse.json({ data: filtered });
  }

  return backendRes;
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const bodyText = await request.text();

  const backendRes = await proxyToBackend({
    request: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyText || undefined,
    }),
    path: "/api/editorcontrols",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });

  if (backendRes.status === 404) {
    try {
      const payload = bodyText ? JSON.parse(bodyText) : {};
      const now = new Date().toISOString();
      const created: EditorControlPreset = {
        id: generateId(),
        name: payload.name || "Untitled",
        blockType: payload.blockType || "paragraph",
        status: payload.status || "draft",
        calloutTone: payload.calloutTone,
        ctaTitle: payload.ctaTitle,
        ctaText: payload.ctaText,
        ctaButtonText: payload.ctaButtonText,
        ctaButtonUrl: payload.ctaButtonUrl,
        imageSrc: payload.imageSrc,
        imageAlt: payload.imageAlt,
        imageCaption: payload.imageCaption,
        createdAt: now,
        updatedAt: now,
      };
      devStore.push(created);
      return NextResponse.json({ data: created });
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  return backendRes;
}
