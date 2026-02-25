/**
 * Menu Items API proxy (collection)
 * GET  – list all menu items (public)
 * POST – create a menu item (requires authentication)
 */

import type { NextRequest } from "next/server";
import { proxyToBackend, requireAuth } from "@/lib/apiProxy";

export async function GET() {
  return proxyToBackend({
    request: null,
    path: "/api/menuitems",
    method: "GET",
  });
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult.ok) {
    return authResult.response;
  }

  // Read body so we can both attempt to proxy to the backend and
  // fall back to a local mock if the backend returns 404.
  const bodyText = await request.text();
  const backendRes = await proxyToBackend({
    // Create a regular Request with the same body so proxyToBackend can
    // forward it. Next's Request is compatible at runtime.
    request: new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyText || undefined,
    }),
    path: "/api/menuitems",
    method: "POST",
    accessToken: authResult.auth.accessToken,
  });

  // If backend doesn't implement this endpoint yet, return a fallback
  // mock so the admin UI can continue to function in development.
  if (backendRes.status === 404) {
    try {
      const payload = bodyText ? JSON.parse(bodyText) : {};
      const id =
        globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
          ? globalThis.crypto.randomUUID()
          : `mock-${Date.now()}`;
      const created = {
        id,
        title: payload.title || "Untitled",
        description: payload.description || null,
        categories: [],
      };

      return new Response(JSON.stringify({ data: created }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return backendRes;
}
