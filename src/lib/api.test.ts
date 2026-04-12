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
    if (typeof payload === "string" && payload.trim()) {
      return payload;
    }

    return fallback;
  }),
}));

const noStoreMock = vi.hoisted(() => vi.fn());

vi.mock("@/config/apiBaseUrl", () => ({
  getApiBaseUrl: () => "https://api.example.com",
}));

vi.mock("@/lib/httpTransport", () => httpTransportMocks);

vi.mock("next/cache", () => ({
  unstable_noStore: noStoreMock,
}));

import { apiService, getApiService } from "./api";

describe("apiService", () => {
  const sendHttpRequestMock = httpTransportMocks.sendHttpRequest;
  const parseHttpResponseMock = httpTransportMocks.parseHttpResponse;

  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("caches public tagged GET requests with a 60 second revalidation window", async () => {
    await apiService.getProductCategories();

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "https://api.example.com/api/products/categories",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60, tags: ["products"] },
      },
    );
    expect(noStoreMock).not.toHaveBeenCalled();
  });

  it("caches public untagged GET requests with the same fallback TTL", async () => {
    await apiService.getMenuItems();

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "https://api.example.com/api/menuitems",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      },
    );
    expect(noStoreMock).not.toHaveBeenCalled();
  });

  it("keeps admin reads uncached and authenticated", async () => {
    const service = getApiService("token-123");

    await service.getMenuItemById("menu-1");

    expect(noStoreMock).toHaveBeenCalledTimes(1);
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "https://api.example.com/api/admin/menus/menu-1",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
        next: undefined,
      },
    );
  });

  it("does not opt public breadcrumb fallback reads out of caching", async () => {
    await apiService.getMenuCategoryById("category-1");

    expect(noStoreMock).not.toHaveBeenCalled();
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "https://api.example.com/api/menucategories/category-1",
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        next: { revalidate: 60 },
      },
    );
  });
});
