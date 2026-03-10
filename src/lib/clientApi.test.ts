import { beforeEach, describe, expect, it, vi } from "vitest";

const httpTransportMocks = vi.hoisted(() => ({
  sendHttpRequest: vi.fn(),
  parseHttpResponse: vi.fn(),
  unwrapDataEnvelope: vi.fn((payload: unknown) => {
    if (payload && typeof payload === "object" && "data" in payload) {
      return (payload as { data: unknown }).data;
    }
    return payload;
  }),
  extractErrorMessage: vi.fn((payload: unknown, fallback: string) => {
    if (typeof payload === "string" && payload.trim()) return payload;
    if (payload && typeof payload === "object" && "title" in payload) {
      const p = payload as { title?: string; detail?: string };
      return p.detail ? `${p.title}: ${p.detail}` : (p.title ?? fallback);
    }
    return fallback;
  }),
}));

vi.mock("@/lib/httpTransport", () => httpTransportMocks);

import { adminApi, clientApi, publicApi } from "./clientApi";

const sendHttpRequestMock = httpTransportMocks.sendHttpRequest;
const parseHttpResponseMock = httpTransportMocks.parseHttpResponse;
const unwrapDataEnvelopeMock = httpTransportMocks.unwrapDataEnvelope;
const extractErrorMessageMock = httpTransportMocks.extractErrorMessage;

describe("clientApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps backward-compatible alias to adminApi", () => {
    expect(clientApi).toBe(adminApi);
  });

  it("creates a product on /api/admin/products", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { data: { id: "p1", title: "Test" } },
      isJson: true,
      contentType: "application/json",
    });

    const result = await adminApi.createProduct({ title: "Test" });

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/admin/products", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test" }),
    });
    expect(unwrapDataEnvelopeMock).toHaveBeenCalledWith({
      data: { id: "p1", title: "Test" },
    });
    expect(result).toEqual({ id: "p1", title: "Test" });
  });

  it("uses /api/admin/articles paths for admin article calls", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { data: { id: "a1" } },
      isJson: true,
      contentType: "application/json",
    });

    await adminApi.createArticle({ title: "Article" });
    await adminApi.updateArticle("a1", { title: "Updated" });

    expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
      1,
      "/api/admin/articles",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Article" }),
      },
    );
    expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
      2,
      "/api/admin/articles/a1",
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      },
    );
  });

  it("throws extracted ProblemDetails-friendly error for non-ok response", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { title: "Forbidden", detail: "Missing role" },
      isJson: true,
      contentType: "application/json",
    });
    extractErrorMessageMock.mockReturnValue("Forbidden: Missing role");

    await expect(adminApi.getMenuItems()).rejects.toThrow(
      "Forbidden: Missing role",
    );

    expect(extractErrorMessageMock).toHaveBeenCalledWith(
      { title: "Forbidden", detail: "Missing role" },
      "HTTP 403: Forbidden",
    );
  });

  it("uses public endpoints without auth header", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { data: [] },
      isJson: true,
      contentType: "application/json",
    });

    await publicApi.getPublishedArticles();

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/articles?status=published",
      {
        method: "GET",
        credentials: "include",
        headers: {},
        body: undefined,
      },
    );
  });

  it("deletes admin category on /api/admin/categories/{id}", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: "No Content",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: "",
      isJson: false,
      contentType: "text/plain",
    });

    await adminApi.deleteCategory("c1");

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/categories/c1",
      {
        method: "DELETE",
        credentials: "include",
        headers: {},
        body: undefined,
      },
    );
  });
});
