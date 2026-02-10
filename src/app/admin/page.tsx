/**
 * Admin Dashboard Home Page
 */

import Link from "next/link";
import { apiService } from "@/lib/api";

export default async function AdminDashboard() {
  // Fetch summary stats
  const [articlesResponse, categoriesResponse] = await Promise.all([
    apiService.getAllArticles(),
    apiService.getProductCategories(),
  ]);

  const articles = articlesResponse.data || [];
  const categories = categoriesResponse.data || [];
  const products = categories.flatMap((cat) => cat.items || []);

  const publishedArticles = articles.filter(
    (a) => a.status === "published",
  ).length;
  const draftArticles = articles.filter((a) => a.status === "draft").length;

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Dashboard</h1>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Total Articles
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {articles.length}
            </div>
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              {publishedArticles} published, {draftArticles} draft
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Categories
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {categories.length}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Products
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 700 }}>
              {products.length}
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Quick Actions
            </div>
            <Link
              href="/admin/articles/new"
              className="btn btn-sm sb-btn-primary mt-2 w-100"
            >
              New Article
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="row g-3">
        <div className="col-md-6">
          <div className="sb-card p-4">
            <h2 style={{ fontWeight: 600, marginBottom: "1rem" }}>
              Content Management
            </h2>
            <div className="d-flex flex-column gap-2">
              <Link href="/admin/articles" className="sb-article-link">
                <span>Manage Articles</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/admin/products" className="sb-article-link">
                <span>Manage Products</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/admin/categories" className="sb-article-link">
                <span>Manage Categories</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="sb-card p-4">
            <h2 style={{ fontWeight: 600, marginBottom: "1rem" }}>
              Recent Activity
            </h2>
            <p className="sb-muted">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
