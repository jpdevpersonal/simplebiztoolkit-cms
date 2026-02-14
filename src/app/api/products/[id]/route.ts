/**
 * Products API proxy (per-id)
 * - Allows PUT to update a product but requires an authenticated NextAuth session
 * - Proxies other methods to the backend
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Use NextAuth server helper to validate session
  // In NextAuth v5, we need to await headers() for proper cookie access
  const headersList = await headers();
  console.log("[API PUT] Request headers:");
  console.log(
    "  Cookie:",
    headersList.get("cookie")?.substring(0, 100) + "...",
  );

  const session = await auth();

  console.log("[API PUT /products/[id]] Session:", session ? "EXISTS" : "NULL");
  if (session) {
    console.log("[API PUT /products/[id]] User:", session.user?.email);
    console.log(
      "[API PUT /products/[id]] Has accessToken:",
      !!(session as any).accessToken,
    );
  } else {
    console.log(
      "[API PUT /products/[id]] No session - cookies:",
      headersList.get("cookie"),
    );
  }

  if (!session) {
    console.log("[API PUT /products/[id]] Unauthorized - no session found");
    return NextResponse.json(
      { error: "Unauthorized - No session found. Please log in again." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  // Forward the original request body to the backend
  const body = await request.text();

  // Get the JWT token from the session
  const accessToken = (session as any).accessToken;

  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/json",
      // Use the JWT token from the session
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "text/plain",
    },
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const res = await fetch(`${BACKEND}/api/products/${id}`);
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "text/plain",
    },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  // Protect delete too
  await headers();
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  // Get the JWT token from the session
  const accessToken = (session as any).accessToken;

  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: "DELETE",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "text/plain",
    },
  });
}
