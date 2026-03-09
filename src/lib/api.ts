/**
 * Centralized API Service for communicating with C# Backend
 * Handles authentication, request formatting, and error handling
 */

import { unstable_noStore as noStore } from "next/cache";
import {
  extractErrorMessage,
  parseHttpResponse,
  sendHttpRequest,
  unwrapDataEnvelope,
} from "@/lib/httpTransport";

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  statusCode: number;
}

// Article Types (matches DB schema)
export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  content: string; // HTML content
  /** Serialised TipTap JSON document (block editor source-of-truth) */
  editorJson?: string | null;
  dateISO: string;
  dateModified?: string;
  category: string;
  readingMinutes: number;
  badges?: string[];
  featuredImage?: string;
  headerImage?: string;
  status: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

// Product Types (matches DB schema)
export interface ProductItem {
  id: string;
  title: string;
  slug: string;
  problem: string;
  description?: string;
  bullets: string[];
  image: string;
  etsyUrl: string;
  productPageUrl?: string;
  price: string;
  categoryId: string;
  status: "draft" | "published";
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  summary: string;
  howThisHelps: string;
  heroImage: string;
  items?: ProductItem[];
}

// Menu Types (matches DB schema)
export interface MenuItem {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published";
  categories?: MenuCategory[];
  pages?: MenuItemPage[]; // pages attached directly (no category)
}

export interface MenuCategory {
  id: string;
  menuItemId: string;
  title: string;
  description?: string;
  status?: "draft" | "published";
  pages?: MenuItemPage[];
  menuItem?: MenuItem;
}

export interface MenuItemPage {
  id: string;
  /** Direct parent when page lives under a menu item without a category */
  menuItemId?: string;
  /** Parent category (mutually exclusive with top-level menuItemId) */
  menuCategoryId?: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  /** Serialised TipTap JSON document (block editor source-of-truth) */
  editorJson?: string | null;
  dateISO: string;
  dateModified: string;
  category?: string;
  featuredImage?: string;
  headerImage?: string;
  status: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  menuCategory?: MenuCategory;
  menuItem?: MenuItem;
}

// API Service Class
class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";
  }

  /**
   * Set authentication token (JWT)
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken() {
    this.authToken = null;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetchApi<T>(
    endpoint: string,
    options?: RequestInit,
    tags?: string[],
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;

      // For Next.js ISR with revalidation tags
      const fetchOptions: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
        next: tags ? { tags } : undefined,
      };

      const response = await sendHttpRequest(url, fetchOptions);
      const { payload } = await parseHttpResponse(response);

      if (!response.ok) {
        return {
          error: extractErrorMessage(
            payload,
            `HTTP ${response.status}: ${response.statusText}`,
          ),
          statusCode: response.status,
        };
      }

      return {
        data: unwrapDataEnvelope<T>(payload),
        statusCode: response.status,
      };
    } catch (error) {
      console.error("API fetch error:", error);
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        statusCode: 500,
      };
    }
  }

  // ==================== ARTICLE ENDPOINTS ====================

  /**
   * Get all published articles
   */
  async getArticles(): Promise<ApiResponse<Article[]>> {
    return this.fetchApi<Article[]>(
      "/api/articles?status=published",
      {
        method: "GET",
      },
      ["articles"],
    );
  }

  /**
   * Get article by slug
   */
  async getArticleBySlug(slug: string): Promise<ApiResponse<Article>> {
    return this.fetchApi<Article>(
      `/api/articles/slug/${slug}`,
      {
        method: "GET",
      },
      ["articles", `article-${slug}`],
    );
  }

  /**
   * Get article by ID (admin only)
   */
  async getArticleById(id: string): Promise<ApiResponse<Article>> {
    noStore(); // Don't cache in admin
    return this.fetchApi<Article>(`/api/articles/${id}`, {
      method: "GET",
    });
  }

  /**
   * Get all articles including drafts (admin only)
   */
  async getAllArticles(): Promise<ApiResponse<Article[]>> {
    noStore(); // Don't cache in admin
    return this.fetchApi<Article[]>("/api/articles", {
      method: "GET",
    });
  }

  /**
   * Create new article (admin only)
   */
  async createArticle(
    article: Partial<Article>,
  ): Promise<ApiResponse<Article>> {
    noStore();
    return this.fetchApi<Article>("/api/articles", {
      method: "POST",
      body: JSON.stringify(article),
    });
  }

  /**
   * Update article (admin only)
   */
  async updateArticle(
    id: string,
    article: Partial<Article>,
  ): Promise<ApiResponse<Article>> {
    noStore();
    return this.fetchApi<Article>(`/api/articles/${id}`, {
      method: "PUT",
      body: JSON.stringify(article),
    });
  }

  /**
   * Delete article (admin only)
   */
  async deleteArticle(id: string): Promise<ApiResponse<void>> {
    noStore();
    return this.fetchApi<void>(`/api/articles/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== PRODUCT ENDPOINTS ====================

  /**
   * Get all product categories with items
   */
  async getProductCategories(): Promise<ApiResponse<ProductCategory[]>> {
    return this.fetchApi<ProductCategory[]>(
      "/api/products/categories",
      {
        method: "GET",
      },
      ["products"],
    );
  }

  async getAllProducts(): Promise<ApiResponse<ProductCategory[]>> {
    return this.fetchApi<ProductCategory[]>(
      "/api/products/allCategories",
      {
        method: "GET",
      },
      ["products"],
    );
  }

  /**
   * Get single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ApiResponse<ProductCategory>> {
    return this.fetchApi<ProductCategory>(
      `/api/products/categories/slug/${slug}`,
      {
        method: "GET",
      },
      ["products", `category-${slug}`],
    );
  }

  /**
   * Get product by slug
   */
  async getProductBySlug(
    categorySlug: string,
    productSlug: string,
  ): Promise<ApiResponse<ProductItem>> {
    return this.fetchApi<ProductItem>(
      `/api/products/slug/${categorySlug}/${productSlug}`,
      { method: "GET" },
      ["products", `product-${productSlug}`],
    );
  }

  /**
   * Get product by ID (admin only)
   */
  async getProductById(id: string): Promise<ApiResponse<ProductItem>> {
    noStore(); // Don't cache in admin
    return this.fetchApi<ProductItem>(`/api/products/${id}`, {
      method: "GET",
    });
  }

  /**
   * Create product (admin only)
   */
  async createProduct(
    product: Partial<ProductItem>,
  ): Promise<ApiResponse<ProductItem>> {
    noStore();
    return this.fetchApi<ProductItem>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(
    id: string,
    product: Partial<ProductItem>,
  ): Promise<ApiResponse<ProductItem>> {
    noStore();
    return this.fetchApi<ProductItem>(`/api/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    noStore();
    return this.fetchApi<void>(`/api/products/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== CATEGORY ENDPOINTS ====================

  /**
   * Create category (admin only)
   */
  async createCategory(
    category: Partial<ProductCategory>,
  ): Promise<ApiResponse<ProductCategory>> {
    noStore();
    return this.fetchApi<ProductCategory>("/api/products/categories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  /**
   * Update category (admin only)
   */
  async updateCategory(
    id: string,
    category: Partial<ProductCategory>,
  ): Promise<ApiResponse<ProductCategory>> {
    noStore();
    return this.fetchApi<ProductCategory>(`/api/products/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  // ==================== MENU ITEM ENDPOINTS ====================

  /**
   * Get all menu items (public)
   */
  async getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    return this.fetchApi<MenuItem[]>("/api/menuitems", { method: "GET" }, [
      "menu",
    ]);
  }

  /**
   * Get all menu items with their nested categories and pages (for site nav).
   * Calls the dedicated items-tree endpoint which returns the full hierarchy.
   * Published-status filtering is done client-side in the layout.
   */
  async getPublishedMenuItems(): Promise<ApiResponse<MenuItem[]>> {
    return this.fetchApi<MenuItem[]>(
      "/api/menuitems/items-tree",
      { method: "GET" },
      ["menu"],
    );
  }

  /**
   * Get menu item by ID (admin only)
   */
  async getMenuItemById(id: string): Promise<ApiResponse<MenuItem>> {
    noStore();
    return this.fetchApi<MenuItem>(`/api/menuitems/${id}`, { method: "GET" });
  }

  /**
   * Create menu item (admin only)
   */
  async createMenuItem(
    item: Partial<MenuItem>,
  ): Promise<ApiResponse<MenuItem>> {
    noStore();
    return this.fetchApi<MenuItem>("/api/menuitems", {
      method: "POST",
      body: JSON.stringify(item),
    });
  }

  /**
   * Update menu item (admin only)
   */
  async updateMenuItem(
    id: string,
    item: Partial<MenuItem>,
  ): Promise<ApiResponse<MenuItem>> {
    noStore();
    return this.fetchApi<MenuItem>(`/api/menuitems/${id}`, {
      method: "PUT",
      body: JSON.stringify(item),
    });
  }

  /**
   * Delete menu item (admin only)
   */
  async deleteMenuItem(id: string): Promise<ApiResponse<void>> {
    noStore();
    return this.fetchApi<void>(`/api/menuitems/${id}`, { method: "DELETE" });
  }

  // ==================== MENU CATEGORY ENDPOINTS ====================

  /**
   * Get all menu categories, optionally filtered by menuItemId (public)
   */
  async getMenuCategories(
    menuItemId?: string,
  ): Promise<ApiResponse<MenuCategory[]>> {
    const qs = menuItemId ? `?menuItemId=${menuItemId}` : "";
    return this.fetchApi<MenuCategory[]>(
      `/api/menucategories${qs}`,
      { method: "GET" },
      ["menu"],
    );
  }

  /**
   * Get menu category by ID (public)
   */
  async getMenuCategoryById(id: string): Promise<ApiResponse<MenuCategory>> {
    noStore();
    return this.fetchApi<MenuCategory>(`/api/menucategories/${id}`, {
      method: "GET",
    });
  }

  /**
   * Create menu category (admin only)
   */
  async createMenuCategory(
    category: Partial<MenuCategory>,
  ): Promise<ApiResponse<MenuCategory>> {
    noStore();
    return this.fetchApi<MenuCategory>("/api/menucategories", {
      method: "POST",
      body: JSON.stringify(category),
    });
  }

  /**
   * Update menu category (admin only)
   */
  async updateMenuCategory(
    id: string,
    category: Partial<MenuCategory>,
  ): Promise<ApiResponse<MenuCategory>> {
    noStore();
    return this.fetchApi<MenuCategory>(`/api/menucategories/${id}`, {
      method: "PUT",
      body: JSON.stringify(category),
    });
  }

  /**
   * Delete menu category (admin only)
   */
  async deleteMenuCategory(id: string): Promise<ApiResponse<void>> {
    noStore();
    return this.fetchApi<void>(`/api/menucategories/${id}`, {
      method: "DELETE",
    });
  }

  // ==================== MENU ITEM PAGE ENDPOINTS ====================

  /**
   * Get all menu item pages, optionally filtered by menuItemId / menuCategoryId / status (public)
   */
  async getMenuItemPages(
    menuCategoryId?: string,
    status?: string,
    menuItemId?: string,
  ): Promise<ApiResponse<MenuItemPage[]>> {
    const params = new URLSearchParams();
    if (menuItemId) params.set("menuItemId", menuItemId);
    if (menuCategoryId) params.set("menuCategoryId", menuCategoryId);
    if (status) params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return this.fetchApi<MenuItemPage[]>(
      `/api/menuitempages${qs}`,
      { method: "GET" },
      ["menu"],
    );
  }

  /**
   * Get menu item page by slug (public)
   */
  async getMenuItemPageBySlug(
    slug: string,
  ): Promise<ApiResponse<MenuItemPage>> {
    return this.fetchApi<MenuItemPage>(
      `/api/menuitempages/slug/${slug}`,
      { method: "GET" },
      ["menu", `menupage-${slug}`],
    );
  }

  /**
   * Get menu item page by ID (admin only)
   */
  async getMenuItemPageById(id: string): Promise<ApiResponse<MenuItemPage>> {
    noStore();
    return this.fetchApi<MenuItemPage>(`/api/menuitempages/${id}`, {
      method: "GET",
    });
  }

  /**
   * Create menu item page (admin only)
   */
  async createMenuItemPage(
    page: Partial<MenuItemPage>,
  ): Promise<ApiResponse<MenuItemPage>> {
    noStore();
    return this.fetchApi<MenuItemPage>("/api/menuitempages", {
      method: "POST",
      body: JSON.stringify(page),
    });
  }

  /**
   * Update menu item page (admin only)
   */
  async updateMenuItemPage(
    id: string,
    page: Partial<MenuItemPage>,
  ): Promise<ApiResponse<MenuItemPage>> {
    noStore();
    return this.fetchApi<MenuItemPage>(`/api/menuitempages/${id}`, {
      method: "PUT",
      body: JSON.stringify(page),
    });
  }

  /**
   * Delete menu item page (admin only)
   */
  async deleteMenuItemPage(id: string): Promise<ApiResponse<void>> {
    noStore();
    return this.fetchApi<void>(`/api/menuitempages/${id}`, {
      method: "DELETE",
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export for server-side usage with optional token
export function getApiService(token?: string): ApiService {
  const service = new ApiService();
  if (token) {
    service.setAuthToken(token);
  }
  return service;
}
