/**
 * Centralized API Service for communicating with C# Backend
 * Handles authentication, request formatting, and error handling
 */

import { unstable_noStore as noStore } from "next/cache";

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

// API Service Class
class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5117";
    console.log(this.baseUrl);
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

      console.log(url);
      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          error:
            errorData.message ||
            `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }

      const json: unknown = await response.json();

      // Some backends return an envelope like { data: ... }
      // Unwrap that so callers receive the actual payload.
      let payload: unknown;

      if (json && typeof json === "object" && json !== null && "data" in json) {
        // Narrow to an object with a `data` property of unknown type
        payload = (json as { data: unknown }).data;
      } else {
        payload = json;
      }

      return {
        data: payload as T,
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
