import type { Article, ProductCategory, ProductItem } from "@/lib/api";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

function unwrapResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload
  ) {
    return (payload as { data: T }).data;
  }

  return payload as T;
}

function toErrorMessage(payload: unknown, fallback: string): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { message?: string; error?: string };
    if (candidate.message) return candidate.message;
    if (candidate.error) return candidate.error;
  }

  return fallback;
}

async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers, credentials = "include" } = options;

  const requestHeaders: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  const response = await fetch(url, {
    method,
    credentials,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const fallback = `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(toErrorMessage(payload, fallback));
  }

  if (!isJson) {
    return payload as T;
  }

  return unwrapResponse<T>(payload);
}

function buildArticlesUrl(articleId?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const resource = articleId ? `/api/articles/${articleId}` : "/api/articles";
  return `${baseUrl}${resource}`;
}

export const clientApi = {
  getAllProductCategories() {
    return request<ProductCategory[]>("/api/products/allCategories");
  },

  getProductById(id: string) {
    return request<ProductItem>(`/api/products/${id}`);
  },

  getProductCategories() {
    return request<ProductCategory[]>("/api/products/categories");
  },

  createProduct(product: Partial<ProductItem>) {
    return request<ProductItem>("/api/products", {
      method: "POST",
      body: product,
    });
  },

  updateProduct(id: string, product: Partial<ProductItem>) {
    return request<ProductItem>(`/api/products/${id}`, {
      method: "PUT",
      body: product,
    });
  },

  deleteProduct(id: string) {
    return request<void>(`/api/products/${id}`, { method: "DELETE" });
  },

  updateCategory(id: string, category: Partial<ProductCategory>) {
    return request<ProductCategory>(`/api/products/categories/${id}`, {
      method: "PUT",
      body: category,
    });
  },

  deleteCategory(id: string) {
    return request<void>(`/api/products/categories/${id}`, {
      method: "DELETE",
    });
  },

  createArticle(article: Partial<Article>) {
    return request<Article>(buildArticlesUrl(), {
      method: "POST",
      body: article,
    });
  },

  updateArticle(id: string, article: Partial<Article>) {
    return request<Article>(buildArticlesUrl(id), {
      method: "PUT",
      body: article,
    });
  },

  revalidateContent(type: "article" | "product", slug?: string) {
    return request<void>("/api/revalidate", {
      method: "POST",
      headers: {
        "X-Revalidation-Secret":
          process.env.NEXT_PUBLIC_REVALIDATION_SECRET || "",
      },
      body: { type, slug },
    });
  },
};
