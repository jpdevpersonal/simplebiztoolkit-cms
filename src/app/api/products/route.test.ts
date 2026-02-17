import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/apiProxy", () => ({
  proxyToBackend: vi.fn(),
  requireAuth: vi.fn(),
}));

import { proxyToBackend, requireAuth } from "@/lib/apiProxy";
import { POST } from "./route";

const proxyToBackendMock = vi.mocked(proxyToBackend);
const requireAuthMock = vi.mocked(requireAuth);

describe("POST /api/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized response when auth fails", async () => {
    const unauthorized = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    requireAuthMock.mockResolvedValue({ ok: false, response: unauthorized });

    const request = new Request("http://localhost/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(proxyToBackendMock).not.toHaveBeenCalled();
  });

  it("proxies to backend with access token when authenticated", async () => {
    const proxied = new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { "content-type": "application/json" },
    });
    requireAuthMock.mockResolvedValue({
      ok: true,
      auth: { accessToken: "token-123" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const request = new Request("http://localhost/api/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });

    const response = await POST(request as never);

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request,
      path: "/api/products",
      method: "POST",
      accessToken: "token-123",
    });
    expect(response).toBe(proxied);
  });
});
