import type {
  Article,
  MenuCategory,
  MenuItem,
  MenuItemPage,
  ProductCategory,
  ProductItem,
} from "@/lib/api";
import {
  extractErrorMessage,
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "@/lib/httpTransport";

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE";
type ApiScope = "public" | "admin";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
};

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isBodyInitLike(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    (typeof URLSearchParams !== "undefined" &&
      body instanceof URLSearchParams) ||
    (typeof Blob !== "undefined" && body instanceof Blob) ||
    (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) ||
    ArrayBuffer.isView(body)
  );
}

function serializeRequestBody(body: unknown): BodyInit | undefined {
  if (body === undefined) {
    return undefined;
  }

  if (isFormDataBody(body) || isBodyInitLike(body)) {
    return body;
  }

  return JSON.stringify(body);
}

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type SessionLike = {
  accessToken?: string;
  expiresAtUtc?: string;
};

let adminAccessToken: string | null = null;
let adminTokenExpiresAtUtc: string | null = null;

function isExpired(expiresAtUtc?: string | null): boolean {
  if (!expiresAtUtc) return false;
  const expiresMs = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresMs)) return false;
  return expiresMs <= Date.now();
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;

  const callbackUrl = `${window.location.pathname}${window.location.search}`;
  const loginUrl = `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  window.location.assign(loginUrl);
}

async function resolveAdminToken(): Promise<string | null> {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  if (adminAccessToken) {
    if (isExpired(adminTokenExpiresAtUtc)) {
      clearAdminAuthToken();
      return null;
    }
    return adminAccessToken;
  }

  if (typeof window === "undefined") {
    return null;
  }

  try {
    const { getSession } = await import("next-auth/react");
    const session = (await getSession()) as SessionLike | null;
    if (!session?.accessToken) {
      return null;
    }

    setAdminAuthToken(session.accessToken, session.expiresAtUtc);
    return isExpired(session.expiresAtUtc) ? null : session.accessToken;
  } catch {
    return null;
  }
}

async function request<T>(
  scope: ApiScope,
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers, credentials = "include" } = options;
  const requestHeaders = new Headers(headers);
  const serializedBody = serializeRequestBody(body);

  if (
    body !== undefined &&
    !isFormDataBody(body) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (scope === "admin") {
    const token = await resolveAdminToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    // Convert Headers instance to plain object to make it easier to
    // inspect in tests and to interoperate with environments that
    // expect simple header maps.
    const headersObject: Record<string, string> = {};
    for (const [k, v] of requestHeaders.entries()) {
      headersObject[k] = v;
    }

    // Preserve conventional header capitalisation for tests and interoperability
    if (headersObject["content-type"]) {
      headersObject["Content-Type"] = headersObject["content-type"];
      delete headersObject["content-type"];
    }
    if (headersObject["authorization"]) {
      headersObject["Authorization"] = headersObject["authorization"];
      delete headersObject["authorization"];
    }

    response = await sendHttpRequest(url, {
      method,
      credentials,
      headers: headersObject,
      body: serializedBody,
    });
  } catch (error) {
    const details =
      error instanceof Error && error.message ? error.message : "Network error";
    throw new Error(`Request failed for ${method} ${url}: ${details}`);
  }

  const { payload, isJson } = await parseHttpResponse(response);

  if (!response.ok) {
    const fallback = `HTTP ${response.status}: ${response.statusText}`;
    const message = extractErrorMessage(payload, fallback);

    if (scope === "admin" && response.status === 401) {
      clearAdminAuthToken();
      redirectToLogin();
      throw new ApiClientError(
        "Your session has expired. Please sign in again.",
        response.status,
      );
    }

    if (scope === "admin" && response.status === 403) {
      throw new ApiClientError(
        message || "You are not authorized to perform this action.",
        response.status,
      );
    }

    throw new ApiClientError(message, response.status);
  }

  if (!isJson) {
    return payload as T;
  }

  return unwrapDataEnvelope<T>(payload);
}

export function buildAdminPath(resource: string, id?: string): string {
  return id ? `/api/admin/${resource}/${id}` : `/api/admin/${resource}`;
}

export async function adminRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  return request<T>("admin", url, options);
}

export function setAdminAuthToken(token: string, expiresAtUtc?: string | null) {
  adminAccessToken = token;
  adminTokenExpiresAtUtc = expiresAtUtc ?? null;
}

export function clearAdminAuthToken() {
  adminAccessToken = null;
  adminTokenExpiresAtUtc = null;
}

export const publicApi = {
  getPublishedArticles() {
    return request<Article[]>("public", "/api/articles?status=published");
  },

  getPublishedMenuItems() {
    return request<MenuItem[]>("public", "/api/menuitems?status=published");
  },

  getPublishedMenuPages() {
    return request<MenuItemPage[]>(
      "public",
      "/api/menuitempages?status=published",
    );
  },
};

export const adminApi = {
  getArticles() {
    return request<Article[]>("admin", buildAdminPath("articles"));
  },

  getArticleById(id: string) {
    return request<Article>("admin", buildAdminPath("articles", id));
  },

  createArticle(article: Partial<Article>) {
    return request<Article>("admin", buildAdminPath("articles"), {
      method: "POST",
      body: article,
    });
  },

  updateArticle(id: string, article: Partial<Article>) {
    return request<Article>("admin", buildAdminPath("articles", id), {
      method: "PUT",
      body: article,
    });
  },

  deleteArticle(id: string) {
    return request<void>("admin", buildAdminPath("articles", id), {
      method: "DELETE",
    });
  },

  getAllProductCategories() {
    return request<ProductCategory[]>("admin", buildAdminPath("categories"));
  },

  getProductById(id: string) {
    return request<ProductItem>("admin", buildAdminPath("products", id));
  },

  getProductCategories() {
    return request<ProductCategory[]>("admin", buildAdminPath("categories"));
  },

  createProduct(product: Partial<ProductItem>) {
    return request<ProductItem>("admin", buildAdminPath("products"), {
      method: "POST",
      body: product,
    });
  },

  updateProduct(id: string, product: Partial<ProductItem>) {
    return request<ProductItem>("admin", buildAdminPath("products", id), {
      method: "PUT",
      body: product,
    });
  },

  deleteProduct(id: string) {
    return request<void>("admin", buildAdminPath("products", id), {
      method: "DELETE",
    });
  },

  createCategory(category: Partial<ProductCategory>) {
    return request<ProductCategory>("admin", buildAdminPath("categories"), {
      method: "POST",
      body: category,
    });
  },

  updateCategory(id: string, category: Partial<ProductCategory>) {
    return request<ProductCategory>("admin", buildAdminPath("categories", id), {
      method: "PUT",
      body: category,
    });
  },

  deleteCategory(id: string) {
    return request<void>("admin", buildAdminPath("categories", id), {
      method: "DELETE",
    });
  },

  getMenuItems() {
    return request<MenuItem[]>("admin", buildAdminPath("menus"));
  },

  getMenuItemById(id: string) {
    return request<MenuItem>("admin", buildAdminPath("menus", id));
  },

  createMenuItem(item: Partial<MenuItem>) {
    return request<MenuItem>("admin", buildAdminPath("menus"), {
      method: "POST",
      body: item,
    });
  },

  updateMenuItem(id: string, item: Partial<MenuItem>) {
    return request<MenuItem>("admin", buildAdminPath("menus", id), {
      method: "PUT",
      body: item,
    });
  },

  deleteMenuItem(id: string) {
    return request<void>("admin", buildAdminPath("menus", id), {
      method: "DELETE",
    });
  },

  getMenuCategories(menuItemId?: string) {
    const qs = menuItemId
      ? `?menuItemId=${encodeURIComponent(menuItemId)}`
      : "";
    return request<MenuCategory[]>(
      "admin",
      `${buildAdminPath("menucategories")}${qs}`,
    );
  },

  getMenuCategoryById(id: string) {
    return request<MenuCategory>("admin", buildAdminPath("menucategories", id));
  },

  createMenuCategory(category: Partial<MenuCategory>) {
    return request<MenuCategory>("admin", buildAdminPath("menucategories"), {
      method: "POST",
      body: category,
    });
  },

  updateMenuCategory(id: string, category: Partial<MenuCategory>) {
    return request<MenuCategory>(
      "admin",
      buildAdminPath("menucategories", id),
      {
        method: "PUT",
        body: category,
      },
    );
  },

  deleteMenuCategory(id: string) {
    return request<void>("admin", buildAdminPath("menucategories", id), {
      method: "DELETE",
    });
  },

  getMenuItemPages(
    menuCategoryId?: string,
    status?: string,
    menuItemId?: string,
  ) {
    const params = new URLSearchParams();
    if (menuItemId) params.set("menuItemId", menuItemId);
    if (menuCategoryId) params.set("menuCategoryId", menuCategoryId);
    if (status) params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<MenuItemPage[]>("admin", `${buildAdminPath("pages")}${qs}`);
  },

  getMenuItemPageById(id: string) {
    return request<MenuItemPage>("admin", buildAdminPath("pages", id));
  },

  createMenuItemPage(page: Partial<MenuItemPage>) {
    return request<MenuItemPage>("admin", buildAdminPath("pages"), {
      method: "POST",
      body: page,
    });
  },

  updateMenuItemPage(id: string, page: Partial<MenuItemPage>) {
    return request<MenuItemPage>("admin", buildAdminPath("pages", id), {
      method: "PUT",
      body: page,
    });
  },

  deleteMenuItemPage(id: string) {
    return request<void>("admin", buildAdminPath("pages", id), {
      method: "DELETE",
    });
  },

  revalidateContent(type: "article" | "product", slug?: string) {
    return request<void>("admin", "/api/revalidate", {
      method: "POST",
      body: { type, slug },
    });
  },
};

// Backward-compatible alias used by existing admin components.
export const clientApi = adminApi;
