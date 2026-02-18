import type { Article, ProductCategory, ProductItem } from "@/lib/api";
import {
  extractErrorMessage,
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "@/lib/httpTransport";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

async function request<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers, credentials = "include" } = options;

  const requestHeaders: HeadersInit = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...headers,
  };

  const response = await sendHttpRequest(url, {
    method,
    credentials,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const { payload, isJson } = await parseHttpResponse(response);

  if (!response.ok) {
    const fallback = `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(extractErrorMessage(payload, fallback));
  }

  if (!isJson) {
    return payload as T;
  }

  return unwrapDataEnvelope<T>(payload);
}

function buildArticlesUrl(articleId?: string) {
  const resource = articleId ? `/api/articles/${articleId}` : "/api/articles";
  return resource;
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

  deleteArticle(id: string) {
    return request<void>(buildArticlesUrl(id), { method: "DELETE" });
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
