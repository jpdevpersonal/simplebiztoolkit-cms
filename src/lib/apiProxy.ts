import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { headers } from "next/headers";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { parseHttpResponse, sendHttpRequest } from "@/lib/httpTransport";
import { getApiBaseUrlForServer } from "@/config/apiBaseUrl";

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
    const contentType = request.headers.get("content-type");
    if (
      contentType &&
      !contentType.toLowerCase().startsWith("multipart/form-data")
    ) {
      headersInit["Content-Type"] = contentType;
    }
  }

  if (accessToken) {
    headersInit.Authorization = `Bearer ${accessToken}`;
  }

  return headersInit;
}

async function getProxyRequestBody(
  request: NextRequest | Request | null,
  method: "GET" | "POST" | "PUT" | "DELETE",
): Promise<BodyInit | undefined> {
  if (!request || (method !== "POST" && method !== "PUT")) {
    return undefined;
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.startsWith("multipart/form-data")) {
    return request.formData();
  }

  const text = await request.text();
  return text.length > 0 ? text : undefined;
}

export async function proxyToBackend(options: {
  request: NextRequest | Request | null;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  accessToken?: string;
}) {
  const { request, path, method, accessToken } = options;
  const backend = getApiBaseUrlForServer();

  try {
    const proxiedBody = await getProxyRequestBody(request, method);

    const res = await sendHttpRequest(`${backend}${path}`, {
      method,
      headers: buildHeaders(request, accessToken),
      body: proxiedBody,
    });

    const { payload, contentType } = await parseHttpResponse(res);
    const text =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Content-Type": contentType || "text/plain",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to reach backend";

    return NextResponse.json(
      {
        error: "Backend proxy failed",
        message,
      },
      { status: 502 },
    );
  }
}
