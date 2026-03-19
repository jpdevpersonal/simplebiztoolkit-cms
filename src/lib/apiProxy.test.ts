import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/httpTransport", () => ({
  sendHttpRequest: vi.fn(),
  parseHttpResponse: vi.fn(),
}));

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { parseHttpResponse, sendHttpRequest } from "@/lib/httpTransport";
import { proxyToBackend, requireAuth } from "./apiProxy";

const headersMock = vi.mocked(headers);
const authMock = vi.mocked(auth);
const parseHttpResponseMock = vi.mocked(parseHttpResponse);
const sendHttpRequestMock = vi.mocked(sendHttpRequest);

describe("apiProxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    headersMock.mockResolvedValue(new Headers());
  });

  describe("requireAuth", () => {
    it("returns unauthorized response when no session exists", async () => {
      authMock.mockResolvedValue(null);

      const result = await requireAuth();

      expect(headersMock).toHaveBeenCalled();
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.response.status).toBe(401);
        await expect(result.response.json()).resolves.toEqual({
          error: "Unauthorized",
        });
      }
    });

    it("returns auth context with access token when session exists", async () => {
      authMock.mockResolvedValue({ accessToken: "access-123" } as never);

      const result = await requireAuth();

      expect(result).toEqual({
        ok: true,
        auth: { accessToken: "access-123" },
      });
    });
  });

  describe("proxyToBackend", () => {
    it("forwards POST request body and auth header", async () => {
      vi.stubEnv("NODE_ENV", "development");

      const request = new Request("http://localhost/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Test" }),
      });

      sendHttpRequestMock.mockResolvedValue(
        new Response(null, {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
      );
      parseHttpResponseMock.mockResolvedValue({
        payload: { id: 1 },
        isJson: true,
        contentType: "application/json",
      });

      const response = await proxyToBackend({
        request: request as never,
        path: "/api/products",
        method: "POST",
        accessToken: "access-123",
      });

      expect(sendHttpRequestMock).toHaveBeenCalledWith(
        "http://localhost:5117/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer access-123",
          },
          body: JSON.stringify({ title: "Test" }),
        },
      );
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({ id: 1 });
    });

    it("forwards GET without body and uses text/plain fallback", async () => {
      vi.stubEnv("NODE_ENV", "development");

      sendHttpRequestMock.mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: { "content-type": "text/plain" },
        }),
      );
      parseHttpResponseMock.mockResolvedValue({
        payload: "plain text",
        isJson: false,
        contentType: "",
      });

      const response = await proxyToBackend({
        request: null,
        path: "/api/products/1",
        method: "GET",
      });

      expect(sendHttpRequestMock).toHaveBeenCalledWith(
        "http://localhost:5117/api/products/1",
        {
          method: "GET",
          headers: {},
          body: undefined,
        },
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/plain");
      await expect(response.text()).resolves.toBe("plain text");
    });

    it("resolves the backend URL from the current env on each call", async () => {
      vi.stubEnv("NODE_ENV", "production");

      sendHttpRequestMock.mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
      parseHttpResponseMock.mockResolvedValue({
        payload: { ok: true },
        isJson: true,
        contentType: "application/json",
      });

      vi.stubEnv("API_URL", "https://first.example.com/api");
      await proxyToBackend({
        request: null,
        path: "/api/admin/products/1",
        method: "GET",
      });

      vi.stubEnv("API_URL", "https://second.example.com/api");
      await proxyToBackend({
        request: null,
        path: "/api/admin/products/1",
        method: "GET",
      });

      expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
        1,
        "https://first.example.com/api/admin/products/1",
        {
          method: "GET",
          headers: {},
          body: undefined,
        },
      );
      expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
        2,
        "https://second.example.com/api/admin/products/1",
        {
          method: "GET",
          headers: {},
          body: undefined,
        },
      );
    });

    it("returns 502 response when backend request fails", async () => {
      vi.stubEnv("NODE_ENV", "development");

      sendHttpRequestMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));

      const response = await proxyToBackend({
        request: null,
        path: "/api/products/1",
        method: "GET",
      });

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Backend proxy failed",
        message: "ECONNREFUSED",
      });
    });
  });
});
