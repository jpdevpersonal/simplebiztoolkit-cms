/**
 * Products API proxy (per-id)
 * - Allows PUT to update a product but requires an authenticated NextAuth session
 * - Proxies other methods to the backend
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { auth } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // Use NextAuth server helper to validate session
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;

  // Forward the original request body to the backend
  const body = await request.text();

  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/json",
      // Forward auth token if available (server-to-server)
      ...(request.headers.get("authorization")
        ? { Authorization: request.headers.get("authorization")! }
        : {}),
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
  { params }: { params: { id: string } },
) {
  const id = params.id;
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
  { params }: { params: { id: string } },
) {
  // Protect delete too
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const res = await fetch(`${BACKEND}/api/products/${id}`, {
    method: "DELETE",
  });
  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "text/plain",
    },
  });
}
