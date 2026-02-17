import { beforeEach, describe, expect, it, vi } from "vitest";

const revalidationMocks = vi.hoisted(() => ({
  revalidateArticle: vi.fn(),
  revalidateAllArticles: vi.fn(),
  revalidateProduct: vi.fn(),
  revalidateCategory: vi.fn(),
  revalidateAllProducts: vi.fn(),
}));

vi.mock("@/lib/revalidation", () => ({
  revalidateArticle: revalidationMocks.revalidateArticle,
  revalidateAllArticles: revalidationMocks.revalidateAllArticles,
  revalidateProduct: revalidationMocks.revalidateProduct,
  revalidateCategory: revalidationMocks.revalidateCategory,
  revalidateAllProducts: revalidationMocks.revalidateAllProducts,
}));

import { POST } from "./route";

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVALIDATION_SECRET = "secret-123";
  });

  it("returns 401 when secret header is invalid", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "X-Revalidation-Secret": "wrong" },
      body: JSON.stringify({ type: "article", slug: "a" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: "Unauthorized" });
  });

  it("revalidates a specific article when slug is present", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "X-Revalidation-Secret": "secret-123" },
      body: JSON.stringify({ type: "article", slug: "hello-world" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(revalidationMocks.revalidateArticle).toHaveBeenCalledWith(
      "hello-world",
    );
    expect(revalidationMocks.revalidateAllArticles).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(json.revalidated).toBe(true);
    expect(json.type).toBe("article");
    expect(json.slug).toBe("hello-world");
  });

  it("revalidates all products when type is all", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "X-Revalidation-Secret": "secret-123" },
      body: JSON.stringify({ type: "all" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(revalidationMocks.revalidateAllArticles).toHaveBeenCalledTimes(1);
    expect(revalidationMocks.revalidateAllProducts).toHaveBeenCalledTimes(1);
  });

  it("returns 400 for invalid revalidation type", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "X-Revalidation-Secret": "secret-123" },
      body: JSON.stringify({ type: "invalid" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: "Invalid revalidation type" });
  });

  it("returns 500 when request body parsing throws", async () => {
    const fakeRequest = {
      headers: new Headers({ "X-Revalidation-Secret": "secret-123" }),
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    };

    const response = await POST(fakeRequest as never);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: "Revalidation failed" });
  });
});
