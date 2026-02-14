# Frontend API Integration Guide

This guide explains how the Next.js frontend should interact with the `simplebiztoolkit-api`. It details the authentication mechanism, available endpoints, request/response formats, and provides TypeScript interfaces for the data models.

## Base URL

- **Development**: `http://localhost:5117` or `https://localhost:7129`
- **Production**: Configure via environment variables (e.g., `NEXT_PUBLIC_API_URL`).

## Authentication

The API uses **JWT Bearer Token** authentication.
- **Login**: Send a `POST` request to `/api/auth/login` with email and password.
- **Response**: Returns a JSON object containing the JWT `token` and `user` details.
- **Usage**: Store the token (e.g., in `localStorage` or `HttpOnly` cookie) and include it in the `Authorization` header for all protected requests.

**Header Format:**
```http
Authorization: Bearer <your-token-here>
```

## TypeScript Interfaces

Use these interfaces to type your API requests and responses.

```typescript
// Authentication
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string; // or AdminName from config
  };
}

// Articles
export interface Article {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  dateISO: string; // DateOnly in C# maps to string (YYYY-MM-DD)
  dateModified: string;
  category?: string;
  readingMinutes: number;
  badges: string[];
  featuredImage?: string;
  headerImage?: string;
  status: string; // 'draft' | 'published'
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export interface CreateArticleDto {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  content?: string;
  category?: string;
  readingMinutes: number;
  badges: string[];
  featuredImage?: string;
  headerImage?: string;
  status?: string; // defaults to 'draft'
  seoTitle?: string;
  seoDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

// Products & Categories
export interface Product {
  id: string;
  title: string;
  slug: string;
  problem?: string;
  description?: string;
  bullets: string[];
  image?: string;
  etsyUrl?: string;
  price?: string;
  productPageUrl?: string;
  categoryId: string;
  status: string; // 'draft' | 'published'
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  summary?: string;
  howThisHelps?: string;
  heroImage?: string;
  items: Product[];
}

export interface CreateProductDto {
  title: string;
  slug: string;
  problem?: string;
  description?: string;
  bullets: string[];
  image?: string;
  etsyUrl?: string;
  price?: string;
  productPageUrl?: string;
  categoryId: string;
  status?: string; // defaults to 'draft'
}

export interface CreateCategoryDto {
  slug: string;
  name: string;
  summary?: string;
  howThisHelps?: string;
  heroImage?: string;
}
```

## API Endpoints Reference

### 1. Authentication
- **POST** `/api/auth/login`
  - Body: `LoginRequest`
  - Response: `AuthResponse`
  - *Public access*

### 2. Articles
- **GET** `/api/articles`
  - Query Params: `?status=published` (optional)
  - Headers: Auth token required to see drafts. Public users only see published if status param is set.
  - Response: `{ data: Article[] }`
  
- **GET** `/api/articles/slug/{slug}`
  - Response: `{ data: Article }`
  
- **GET** `/api/articles/{id}`
  - Headers: **Auth Required**
  - Response: `{ data: Article }`
  
- **POST** `/api/articles`
  - Headers: **Auth Required**
  - Body: `CreateArticleDto`
  - Response: `{ data: Article }`
  
- **PUT** `/api/articles/{id}`
  - Headers: **Auth Required**
  - Body: `CreateArticleDto`
  - Response: `{ data: Article }`

- **DELETE** `/api/articles/{id}`
  - Headers: **Auth Required**
  - Response: `{ success: true }`

### 3. Products
- **GET** `/api/products/categories`
  - Response: `{ data: ProductCategory[] }` (Includes nested `items` (Products))
  
- **GET** `/api/products/categories/slug/{slug}`
  - Response: `{ data: ProductCategory }`
  
- **GET** `/api/products/slug/{categorySlug}/{productSlug}`
  - Response: `{ data: Product }`
  
- **POST** `/api/products`
  - Headers: **Auth Required**
  - Body: `CreateProductDto`
  - Response: `{ data: Product }`

- **PUT** `/api/products/{id}`
  - Headers: **Auth Required**
  - Body: `CreateProductDto`
  - Response: `{ data: Product }`

- **DELETE** `/api/products/{id}`
  - Headers: **Auth Required**
  - Response: `{ success: true }`

- **POST** `/api/products/categories`
  - Headers: **Auth Required**
  - Body: `CreateCategoryDto`
  - Response: (Check controller return type, typically composed of created resource)

## Implementation Strategy (for Copilot)

1.  **Create an API Client Wrapper**:
    - Implement a centralized `apiClient` or `fetchWrapper` function.
    - Automatically attach the `Authorization` header if a token exists in storage.
    - Handle base URL configuration.
    - Handle common errors (401 Unauthorized -> Redirect to login).

2.  **State Management**:
    - Use a context or state manager (e.g., React Context, Zustand) to store the `user` and `token` upon successful login.

3.  **CRUD Operations**:
    - Build service functions for each entity (e.g., `articleService.ts`, `productService.ts`) that utilize the wrapper.
    - Example:
      ```typescript
      export const articleService = {
        getAll: () => api.get<Article[]>('/articles'),
        create: (data: CreateArticleDto) => api.post<Article>('/articles', data),
        // ...
      };
      ```
