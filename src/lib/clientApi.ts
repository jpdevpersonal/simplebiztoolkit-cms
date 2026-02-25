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

  createCategory(category: Partial<ProductCategory>) {
    return request<ProductCategory>("/api/products/categories", {
      method: "POST",
      body: category,
    });
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
    // Authentication is handled by the NextAuth session cookie.
    // No secret header needed (and never use NEXT_PUBLIC_ for secrets).
    return request<void>("/api/revalidate", {
      method: "POST",
      body: { type, slug },
    });
  },

  // ==================== MENU ITEM METHODS ====================

  getMenuItems() {
    return request<MenuItem[]>("/api/menuitems");
  },

  getMenuItemById(id: string) {
    return request<MenuItem>(`/api/menuitems/${id}`);
  },

  createMenuItem(item: Partial<MenuItem>) {
    return request<MenuItem>("/api/menuitems", { method: "POST", body: item });
  },

  updateMenuItem(id: string, item: Partial<MenuItem>) {
    return request<MenuItem>(`/api/menuitems/${id}`, {
      method: "PUT",
      body: item,
    });
  },

  deleteMenuItem(id: string) {
    return request<void>(`/api/menuitems/${id}`, { method: "DELETE" });
  },

  // ==================== MENU CATEGORY METHODS ====================

  getMenuCategories(menuItemId?: string) {
    const qs = menuItemId ? `?menuItemId=${menuItemId}` : "";
    return request<MenuCategory[]>(`/api/menucategories${qs}`);
  },

  getMenuCategoryById(id: string) {
    return request<MenuCategory>(`/api/menucategories/${id}`);
  },

  createMenuCategory(category: Partial<MenuCategory>) {
    return request<MenuCategory>("/api/menucategories", {
      method: "POST",
      body: category,
    });
  },

  updateMenuCategory(id: string, category: Partial<MenuCategory>) {
    return request<MenuCategory>(`/api/menucategories/${id}`, {
      method: "PUT",
      body: category,
    });
  },

  deleteMenuCategory(id: string) {
    return request<void>(`/api/menucategories/${id}`, { method: "DELETE" });
  },

  // ==================== MENU ITEM PAGE METHODS ====================

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
    return request<MenuItemPage[]>(`/api/menuitempages${qs}`);
  },

  getMenuItemPageById(id: string) {
    return request<MenuItemPage>(`/api/menuitempages/${id}`);
  },

  createMenuItemPage(page: Partial<MenuItemPage>) {
    return request<MenuItemPage>("/api/menuitempages", {
      method: "POST",
      body: page,
    });
  },

  updateMenuItemPage(id: string, page: Partial<MenuItemPage>) {
    return request<MenuItemPage>(`/api/menuitempages/${id}`, {
      method: "PUT",
      body: page,
    });
  },

  deleteMenuItemPage(id: string) {
    return request<void>(`/api/menuitempages/${id}`, { method: "DELETE" });
  },
};
