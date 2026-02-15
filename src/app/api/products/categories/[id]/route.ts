/**
 * Product Categories API proxy (per-id)
 * - Allows PUT/DELETE for admin-protected operations
 * - Proxies GET to backend
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { Session } from "next-auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await headers();
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.text();
  const accessToken = (session as Session & { accessToken?: string })
    .accessToken;

  const res = await fetch(`${BACKEND}/api/products/categories/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": request.headers.get("content-type") || "application/json",
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
  const res = await fetch(`${BACKEND}/api/products/categories/${id}`);
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
  await headers();
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const accessToken = (session as Session & { accessToken?: string })
    .accessToken;

  const res = await fetch(`${BACKEND}/api/products/categories/${id}`, {
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
