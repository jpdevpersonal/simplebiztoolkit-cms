/**
 * Product Categories API proxy (collection)
 * - POST to create a new category (requires authentication)
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";

export async function POST(request: NextRequest) {
  // Use NextAuth server helper to validate session
  await headers();
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Forward the original request body to the backend
  const body = await request.text();

  // Get the JWT token from the session
  const accessToken = (session as { accessToken?: string }).accessToken;

  const res = await fetch(`${BACKEND}/api/products/categories`, {
    method: "POST",
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
