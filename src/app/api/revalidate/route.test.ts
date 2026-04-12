import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath: cacheMocks.revalidatePath,
  revalidateTag: cacheMocks.revalidateTag,
}));

import { POST } from "./route";

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
    process.env.REVALIDATE_SECRET = "secret-123";
    delete process.env.REVALIDATION_SECRET;
    delete process.env.REVALIDATE_WARMING_ENABLED;
    delete process.env.REVALIDATE_WARM_BASE_URL;
    delete process.env.EDGE_CACHE_PURGE_URL;
    delete process.env.EDGE_CACHE_PURGE_TOKEN;
  });

  it("returns 401 when secret header is invalid", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "wrong" },
      body: JSON.stringify({ paths: ["/templates"] }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("revalidates supplied paths and tags", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({
        paths: ["/templates/product-a", " /templates/category-a "],
        tags: ["product-1", "products", " product-1 "],
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/templates/product-a",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/templates/category-a",
    );
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("product-1");
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("products");
    expect(response.status).toBe(200);
    expect(json.revalidated).toBe(true);
    expect(json.paths).toEqual([
      "/templates/product-a",
      "/templates/category-a",
    ]);
    expect(json.tags).toEqual(["product-1", "products"]);
    expect(json.warm).toEqual({
      attempted: false,
      warmedPaths: [],
      failedPaths: [],
    });
    expect(json.edgePurge).toEqual({ attempted: false });
  });

  it("returns a safe no-op response when paths and tags are omitted", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({}),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(cacheMocks.revalidatePath).not.toHaveBeenCalled();
    expect(cacheMocks.revalidateTag).not.toHaveBeenCalled();
    expect(json).toEqual({
      revalidated: false,
      paths: [],
      tags: [],
      message: "No paths or tags provided",
    });
  });

  it("returns 400 for invalid paths payload", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ paths: "not-an-array" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid paths payload" });
  });

  it("returns 500 when request body parsing throws", async () => {
    const fakeRequest = {
      headers: new Headers({ "x-revalidate-secret": "secret-123" }),
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    };

    const response = await POST(fakeRequest as never);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Revalidation failed" });
  });

  it("accepts the legacy env var, header, and payload shape for local compatibility", async () => {
    delete process.env.REVALIDATE_SECRET;
    process.env.REVALIDATION_SECRET = "legacy-secret";

    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidation-secret": "legacy-secret" },
      body: JSON.stringify({ type: "product", slug: "budget-planner" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.mode).toBe("legacy");
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("products");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/templates");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/templates/[categorySlug]",
      "page",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/templates/[categorySlug]/[productSlug]",
      "page",
    );
  });

  it("warms concrete public paths after revalidation when enabled", async () => {
    process.env.REVALIDATE_WARMING_ENABLED = "true";
    process.env.REVALIDATE_WARM_BASE_URL = "https://www.simplebiztoolkit.com/";

    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({
        paths: ["/templates", "/pages/example", "/templates/[categorySlug]"],
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.simplebiztoolkit.com/templates",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://www.simplebiztoolkit.com/pages/example",
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(json.warm).toEqual({
      attempted: true,
      baseUrl: "https://www.simplebiztoolkit.com",
      warmedPaths: ["/templates", "/pages/example"],
      failedPaths: [],
    });
  });

  it("posts to the edge purge webhook when configured", async () => {
    process.env.EDGE_CACHE_PURGE_URL = "https://purge.example.com/webhook";
    process.env.EDGE_CACHE_PURGE_TOKEN = "purge-token";

    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({
        paths: ["/templates", "/templates/[categorySlug]"],
        tags: ["products"],
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://purge.example.com/webhook",
      expect.objectContaining({
        method: "POST",
        cache: "no-store",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer purge-token",
        }),
      }),
    );
    expect(json.edgePurge).toEqual({
      attempted: true,
      ok: true,
      status: 200,
    });
  });
});
