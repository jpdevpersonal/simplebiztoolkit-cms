/**
 * Admin Dashboard Home Page
 */

import Link from "next/link";
import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import AdminStatCard from "@/components/AdminStatCard";

export default async function AdminDashboard() {
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const [
    articlesResponse,
    categoriesResponse,
    pagesResponse,
    menuItemsResponse,
  ] = await Promise.all([
    service.getAllArticles(),
    service.getProductCategories(),
    service.getMenuItemPages(),
    service.getMenuItems(),
  ]);

  const articles = articlesResponse.data || [];
  const categories = categoriesResponse.data || [];
  const products = categories.flatMap((cat) => cat.items || []);
  const pages = pagesResponse.data || [];
  const menuItems = menuItemsResponse.data || [];

  const publishedArticles = articles.filter(
    (a) => a.status === "published",
  ).length;
  const draftArticles = articles.filter((a) => a.status === "draft").length;

  const quickLinks = [
    {
      href: "/admin/articles",
      label: "Manage Articles",
      description: `${articles.length} articles`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <polyline
            points="10 9 9 9 8 9"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/products",
      label: "Manage Templates",
      description: `${products.length} templates`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="3"
            y1="6"
            x2="21"
            y2="6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M16 10a4 4 0 0 1-8 0"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/categories",
      label: "Manage Template Categories",
      description: `${categories.length} categories`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="3"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="3"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="14"
            width="7"
            height="7"
            rx="1"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      ),
    },
    {
      href: "/admin/menu",
      label: "Manage Menu Items",
      description: `${menuItems.length} menu items`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12h18M3 6h18M3 18h12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      href: "/admin/pages",
      label: "Manage Pages",
      description: `${pages.length} pages`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Dashboard</h1>
      </div>

      {/* Stat grid */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <AdminStatCard
            label="Total Articles"
            value={articles.length}
            note={`${publishedArticles} published · ${draftArticles} draft`}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-md-3">
          <AdminStatCard
            label="Templates"
            value={products.length}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-md-3">
          <AdminStatCard
            label="Menu Items"
            value={menuItems.length}
            valueSize="lg"
          />
        </div>
        <div className="col-6 col-md-3">
          <AdminStatCard label="Pages" value={pages.length} valueSize="lg" />
        </div>
      </div>

      {/* Content sections */}
      <div className="row g-3">
        {/* Quick navigation */}
        <div className="col-md-6">
          <div className="admin-card p-4 h-100">
            <h2
              className="mb-3"
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--sb-muted)",
              }}
            >
              Content Management
            </h2>
            <div className="d-flex flex-column gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="admin-quick-link"
                >
                  <span className="admin-quick-link-icon">{link.icon}</span>
                  <span style={{ flex: 1 }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 600,
                        fontSize: "0.9375rem",
                      }}
                    >
                      {link.label}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8125rem",
                        color: "var(--sb-muted)",
                      }}
                    >
                      {link.description}
                    </span>
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ opacity: 0.4, flexShrink: 0 }}
                  >
                    <path
                      d="M5 12h14M13 5l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Quick create */}
        <div className="col-md-6">
          <div className="admin-card p-4 h-100">
            <h2
              className="mb-3"
              style={{
                fontSize: "0.875rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--sb-muted)",
              }}
            >
              Quick Create
            </h2>
            <div className="d-flex flex-column gap-2">
              <Link href="/admin/articles/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  New Article
                </span>
              </Link>
              <Link href="/admin/products/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  New Template
                </span>
              </Link>
              <Link href="/admin/pages/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  New Page
                </span>
              </Link>
              <Link href="/admin/menu/new" className="admin-quick-link">
                <span className="admin-quick-link-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <line
                      x1="12"
                      y1="5"
                      x2="12"
                      y2="19"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="5"
                      y1="12"
                      x2="19"
                      y2="12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                  New Menu Item
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
