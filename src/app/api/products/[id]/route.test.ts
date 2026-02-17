import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextResponse } from "next/server";

vi.mock("@/lib/apiProxy", () => ({
  proxyToBackend: vi.fn(),
  requireAuth: vi.fn(),
}));

import { proxyToBackend, requireAuth } from "@/lib/apiProxy";
import { DELETE, GET, PUT } from "./route";

const proxyToBackendMock = vi.mocked(proxyToBackend);
const requireAuthMock = vi.mocked(requireAuth);

describe("/api/products/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PUT returns unauthorized when auth fails", async () => {
    const unauthorized = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    requireAuthMock.mockResolvedValue({ ok: false, response: unauthorized });

    const request = new Request("http://localhost/api/products/42", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PUT(request as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(response.status).toBe(401);
    expect(proxyToBackendMock).not.toHaveBeenCalled();
  });

  it("PUT proxies authenticated update", async () => {
    const proxied = new Response("ok", { status: 200 });
    requireAuthMock.mockResolvedValue({
      ok: true,
      auth: { accessToken: "token-123" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const request = new Request("http://localhost/api/products/42", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated" }),
    });

    const response = await PUT(request as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request,
      path: "/api/products/42",
      method: "PUT",
      accessToken: "token-123",
    });
    expect(response).toBe(proxied);
  });

  it("GET proxies product request without auth", async () => {
    const proxied = new Response(JSON.stringify({ id: "42" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const response = await GET({} as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request: null,
      path: "/api/products/42",
      method: "GET",
    });
    expect(response).toBe(proxied);
    expect(requireAuthMock).not.toHaveBeenCalled();
  });

  it("DELETE proxies authenticated delete", async () => {
    const proxied = new Response(null, { status: 204 });
    requireAuthMock.mockResolvedValue({
      ok: true,
      auth: { accessToken: "token-123" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const response = await DELETE({} as never, {
      params: Promise.resolve({ id: "42" }),
    });

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request: null,
      path: "/api/products/42",
      method: "DELETE",
      accessToken: "token-123",
    });
    expect(response).toBe(proxied);
  });
});
