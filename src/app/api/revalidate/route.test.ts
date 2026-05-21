import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: cacheMocks.revalidatePath,
  revalidateTag: cacheMocks.revalidateTag,
}));

import { POST } from "./route";

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REVALIDATE_SECRET = "secret-123";
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

  it("handles legacy category type with slug – adds a category-specific tag", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ type: "category", slug: "spreadsheets" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.mode).toBe("legacy");
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("products");
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith(
      "category-spreadsheets",
    );
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/templates");
  });

  it("handles legacy category type without slug – only invalidates products tag", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ type: "category" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.tags).toEqual(["products"]);
    expect(cacheMocks.revalidateTag).toHaveBeenCalledOnce();
    expect(cacheMocks.revalidateTag).toHaveBeenCalledWith("products");
  });

  it("handles legacy page type with slug and previousSlug – deduplicates path targets", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({
        type: "page",
        slug: "my-guide",
        previousSlug: "old-guide",
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.mode).toBe("legacy");
    expect(json.paths).toContain("/my-guide");
    expect(json.paths).toContain("/old-guide");
    expect(json.tags).toContain("page-my-guide");
    expect(json.tags).toContain("page-old-guide");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/pages");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith(
      "/pages/[menuItemSlug]",
      "page",
    );
  });

  it("handles legacy page type with same slug and previousSlug – deduplicates to one path", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({
        type: "page",
        slug: "my-guide",
        previousSlug: "my-guide",
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    const slugPaths = json.paths.filter((p: string) => p === "/my-guide");
    expect(slugPaths).toHaveLength(1);
    expect(json.tags).toEqual(["page-my-guide"]);
  });

  it("handles legacy all type – revalidates all known path groups", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ type: "all" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.mode).toBe("legacy");
    expect(json.paths).toContain("/templates");
    expect(json.paths).toContain("/pages");
    expect(json.paths).toContain("/sitemap.xml");
    expect(cacheMocks.revalidatePath).toHaveBeenCalledWith("/[slug]", "page");
  });

  it("returns 400 for an unrecognised legacy type value", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ type: "unknown-type" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid revalidation type");
  });

  it("returns 400 for invalid tags payload", async () => {
    const request = new Request("http://localhost/api/revalidate", {
      method: "POST",
      headers: { "x-revalidate-secret": "secret-123" },
      body: JSON.stringify({ tags: 42 }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid tags payload");
  });
});
