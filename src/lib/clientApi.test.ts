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

import {
  adminApi,
  clearAdminAuthToken,
  clientApi,
  publicApi,
  setAdminAuthToken,
} from "./clientApi";

const sendHttpRequestMock = httpTransportMocks.sendHttpRequest;
const parseHttpResponseMock = httpTransportMocks.parseHttpResponse;
const unwrapDataEnvelopeMock = httpTransportMocks.unwrapDataEnvelope;
const extractErrorMessageMock = httpTransportMocks.extractErrorMessage;

describe("clientApi", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
    clearAdminAuthToken();
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
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

  it("covers remaining admin CRUD wrappers and query builders", async () => {
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

    await adminApi.getArticles();
    await adminApi.getArticleById("a1");
    await adminApi.deleteArticle("a1");
    await adminApi.getAllProductCategories();
    await adminApi.getProductById("p1");
    await adminApi.getProductCategories();
    await adminApi.updateProduct("p1", { title: "Updated" });
    await adminApi.deleteProduct("p1");
    await adminApi.createCategory({ name: "Cat" });
    await adminApi.updateCategory("c1", { name: "Cat2" });
    await adminApi.getMenuItemById("m1");
    await adminApi.createMenuItem({ title: "Menu" });
    await adminApi.updateMenuItem("m1", { title: "Menu2" });
    await adminApi.deleteMenuItem("m1");
    await adminApi.getMenuCategoryById("mc1");
    await adminApi.createMenuCategory({ title: "Cat" });
    await adminApi.updateMenuCategory("mc1", { title: "Cat2" });
    await adminApi.deleteMenuCategory("mc1");
    await adminApi.getMenuItemPageById("pg1");
    await adminApi.createMenuItemPage({ title: "Page" });
    await adminApi.updateMenuItemPage("pg1", { title: "Page2" });
    await adminApi.deleteMenuItemPage("pg1");
    await adminApi.revalidateContent("article", "slug-1");
    await adminApi.getMenuCategories("menu-1");
    await adminApi.getMenuItemPages("cat-1", "published", "menu-1");

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/articles",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/articles/a1",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/products/p1",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/menucategories?menuItemId=menu-1",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/admin/pages?menuItemId=menu-1&menuCategoryId=cat-1&status=published",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/revalidate",
      expect.any(Object),
    );
  });

  it("covers publicApi wrappers for menu endpoints", async () => {
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

    await publicApi.getPublishedMenuItems();
    await publicApi.getPublishedMenuPages();

    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/menuitems?status=published",
      expect.any(Object),
    );
    expect(sendHttpRequestMock).toHaveBeenCalledWith(
      "/api/menuitempages?status=published",
      expect.any(Object),
    );
  });

  it("returns plain payload for non-json success", async () => {
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

    await expect(adminApi.getMenuItems()).resolves.toBe("ok");
  });

  it("throws descriptive error for network failures", async () => {
    sendHttpRequestMock.mockRejectedValueOnce(new Error("socket hang up"));

    await expect(adminApi.getMenuItems()).rejects.toThrow(
      "Request failed for GET /api/admin/menus: socket hang up",
    );
  });

  it("handles 401 by clearing auth and redirecting to login", async () => {
    process.env.NODE_ENV = "development";
    setAdminAuthToken(
      "token-value",
      new Date(Date.now() + 60_000).toISOString(),
    );
    const originalWindow = globalThis.window;
    vi.stubGlobal("window", undefined);

    sendHttpRequestMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    } as Response);
    parseHttpResponseMock.mockResolvedValue({
      payload: { title: "Unauthorized" },
      isJson: true,
      contentType: "application/json",
    });

    await expect(adminApi.getMenuItems()).rejects.toThrow(
      "Your session has expired. Please sign in again.",
    );

    vi.stubGlobal("window", originalWindow);
  });

  it("covers expired token branch (no Authorization header attached)", async () => {
    process.env.NODE_ENV = "development";
    setAdminAuthToken("expired", new Date(Date.now() - 60_000).toISOString());

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

    await adminApi.getMenuItems();

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/admin/menus", {
      method: "GET",
      credentials: "include",
      headers: {},
      body: undefined,
    });
  });

  it("attaches Authorization header for valid admin token", async () => {
    process.env.NODE_ENV = "development";
    setAdminAuthToken("abc123", new Date(Date.now() + 120_000).toISOString());

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

    await adminApi.getMenuItems();

    expect(sendHttpRequestMock).toHaveBeenCalledWith("/api/admin/menus", {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: "Bearer abc123",
      },
      body: undefined,
    });
  });
});
