import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/apiProxy", () => ({
  proxyToBackend: vi.fn(),
  requireAuth: vi.fn(),
}));

import { proxyToBackend, requireAuth } from "@/lib/apiProxy";
import { DELETE, GET, PUT } from "./route";

const proxyToBackendMock = vi.mocked(proxyToBackend);
const requireAuthMock = vi.mocked(requireAuth);

describe("/api/products/categories/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PUT proxies authenticated category update", async () => {
    const proxied = new Response("ok", { status: 200 });
    requireAuthMock.mockResolvedValue({
      ok: true,
      auth: { accessToken: "token-123" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const request = new Request("http://localhost/api/products/categories/9", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await PUT(request as never, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request,
      path: "/api/products/categories/9",
      method: "PUT",
      accessToken: "token-123",
    });
    expect(response).toBe(proxied);
  });

  it("PUT returns unauthorized when auth fails", async () => {
    const unauthorized = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
    requireAuthMock.mockResolvedValue({ ok: false, response: unauthorized });

    const request = new Request("http://localhost/api/products/categories/9", {
      method: "PUT",
    });

    const response = await PUT(request as never, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(401);
    expect(proxyToBackendMock).not.toHaveBeenCalled();
  });

  it("GET proxies category lookup without auth", async () => {
    const proxied = new Response(JSON.stringify({ id: "9" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    proxyToBackendMock.mockResolvedValue(proxied);

    const response = await GET({} as never, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(proxyToBackendMock).toHaveBeenCalledWith({
      request: null,
      path: "/api/products/categories/9",
      method: "GET",
    });
    expect(response).toBe(proxied);
    expect(requireAuthMock).not.toHaveBeenCalled();
  });

  it("DELETE returns unauthorized when auth fails", async () => {
    const unauthorized = new Response(
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401,
        headers: { "content-type": "application/json" },
      },
    );
    requireAuthMock.mockResolvedValue({ ok: false, response: unauthorized });

    const response = await DELETE({} as never, {
      params: Promise.resolve({ id: "9" }),
    });

    expect(response.status).toBe(401);
    expect(proxyToBackendMock).not.toHaveBeenCalled();
  });
});
