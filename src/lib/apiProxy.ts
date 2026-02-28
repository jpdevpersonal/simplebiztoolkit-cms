import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { parseHttpResponse, sendHttpRequest } from "@/lib/httpTransport";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";

type SessionWithToken = Session & { accessToken?: string };

export type AuthContext = {
  accessToken?: string;
};

export async function requireAuth(): Promise<
  | { ok: true; auth: AuthContext }
  | { ok: false; response: NextResponse<{ error: string }> }
> {
  await headers();
  const session = await auth();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    auth: {
      accessToken: (session as SessionWithToken).accessToken,
    },
  };
}

function buildHeaders(
  request: NextRequest | Request | null,
  accessToken?: string,
): HeadersInit {
  const headersInit: HeadersInit = {};

  if (request) {
    headersInit["Content-Type"] =
      request.headers.get("content-type") || "application/json";
  }

  if (accessToken) {
    headersInit.Authorization = `Bearer ${accessToken}`;
  }

  return headersInit;
}

export async function proxyToBackend(options: {
  request: NextRequest | Request | null;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  accessToken?: string;
}) {
  const { request, path, method, accessToken } = options;

  const body =
    request && (method === "POST" || method === "PUT")
      ? await request.text()
      : undefined;

  const res = await sendHttpRequest(`${BACKEND}${path}`, {
    method,
    headers: buildHeaders(request, accessToken),
    body,
  });

  const { payload, contentType } = await parseHttpResponse(res);
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": contentType || "text/plain",
    },
  });
}
