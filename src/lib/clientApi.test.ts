import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/httpTransport", () => ({
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
    return fallback;
  }),
}));

import {
  extractErrorMessage,
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "@/lib/httpTransport";
import { clientApi } from "./clientApi";

const sendHttpRequestMock = vi.mocked(sendHttpRequest);
const parseHttpResponseMock = vi.mocked(parseHttpResponse);
const unwrapDataEnvelopeMock = vi.mocked(unwrapDataEnvelope);
const extractErrorMessageMock = vi.mocked(extractErrorMessage);

describe("clientApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_REVALIDATION_SECRET;
  });

  it("creates a product with POST json payload", async () => {
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

    const result = await clientApi.createProduct({ title: "Test" });

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/products", {
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

  it("deletes a product with DELETE and no body", async () => {
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

    await clientApi.deleteProduct("p1");

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/products/p1", {
      method: "DELETE",
      credentials: "include",
      headers: {},
      body: undefined,
    });
  });

  it("builds absolute article URL from NEXT_PUBLIC_API_URL", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

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

    await clientApi.createArticle({ title: "Article" });
    await clientApi.updateArticle("a1", { title: "Updated" });

    expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/api/articles",
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Article" }),
      },
    );
    expect(sendHttpRequestMock).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/api/articles/a1",
      {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Updated" }),
      },
    );
  });

  it("sends revalidation secret header for revalidateContent", async () => {
    process.env.NEXT_PUBLIC_REVALIDATION_SECRET = "secret-xyz";

    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: "ok",
      isJson: false,
      contentType: "text/plain",
    });

    await clientApi.revalidateContent("article", "hello-world");

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/revalidate", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Revalidation-Secret": "secret-xyz",
      },
      body: JSON.stringify({ type: "article", slug: "hello-world" }),
    });
  });

  it("throws extracted error message for non-ok response", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { error: "backend exploded" },
      isJson: true,
      contentType: "application/json",
    });
    extractErrorMessageMock.mockReturnValue("backend exploded");

    await expect(clientApi.getProductCategories()).rejects.toThrow(
      "backend exploded",
    );

    expect(extractErrorMessageMock).toHaveBeenCalledWith(
      { error: "backend exploded" },
      "HTTP 500: Internal Server Error",
    );
  });

  it("returns raw payload when response is not json", async () => {
    sendHttpRequestMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: "plain text payload",
      isJson: false,
      contentType: "text/plain",
    });

    const result = await clientApi.getAllProductCategories();

    expect(result).toBe("plain text payload");
    expect(unwrapDataEnvelopeMock).not.toHaveBeenCalled();
  });
});
