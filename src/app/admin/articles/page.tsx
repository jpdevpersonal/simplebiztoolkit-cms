/**
 * Article List Page - Admin
 * Lists all articles with filtering by status
 */

import Link from "next/link";
import { apiService } from "@/lib/api";

export default async function ArticlesPage() {
  const response = await apiService.getAllArticles();
  const articles = response.data || [];

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontWeight: 700 }}>Articles</h1>
        <Link href="/admin/articles/new" className="btn sb-btn-primary">
          + New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Total
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {articles.length}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Published
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {published.length}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="sb-card p-3">
            <div className="sb-muted" style={{ fontSize: "0.875rem" }}>
              Drafts
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>
              {drafts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Article Table */}
      <div className="sb-card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Title</th>
                <th>Slug</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 sb-muted">
                    No articles found. Create your first article!
                  </td>
                </tr>
              )}
              {articles.map((article) => (
                <tr key={article.id}>
                  <td style={{ fontWeight: 600 }}>{article.title}</td>
                  <td className="sb-muted">{article.slug}</td>
                  <td>{article.category}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          article.status === "published"
                            ? "var(--sb-success)"
                            : "var(--sb-warning)",
                        color: "#fff",
                      }}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="sb-muted" style={{ fontSize: "0.875rem" }}>
                    {article.dateISO}
                  </td>
                  <td>
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="btn btn-sm sb-btn-ghost"
                    >
                      Edit
                    </Link>
                    {article.status === "published" && (
                      <Link
                        href={`/blog/${article.slug}`}
                        className="btn btn-sm sb-btn-ghost ms-2"
                        target="_blank"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
