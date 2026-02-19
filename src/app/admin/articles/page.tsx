/**
 * Article List Page - Admin
 * Lists all articles with filtering by status
 */

import Link from "next/link";
import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import AdminStatCard from "@/components/AdminStatCard";

export default async function ArticlesPage() {
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getAllArticles();
  const articles = response.data || [];

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");

  return (
    <div>
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Articles</h1>
        <Link href="/admin/articles/new" className="admin-btn-save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
          New Article
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <AdminStatCard label="Total" value={articles.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Published" value={published.length} />
        </div>
        <div className="col-4">
          <AdminStatCard label="Drafts" value={drafts.length} />
        </div>
      </div>

      {/* Article table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Slug</th>
              <th>Category</th>
              <th>Status</th>
              <th>Published</th>
              <th>Preview</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-empty-state">
                  No articles found. Create your first article!
                </td>
              </tr>
            )}
            {articles.map((article) => (
              <tr key={article.id}>
                <td style={{ fontWeight: 600, maxWidth: "280px" }}>
                  {article.title}
                </td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.875rem",
                    maxWidth: "180px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {article.slug}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.875rem" }}>
                  {article.category}
                </td>
                <td>
                  <span
                    className={
                      "admin-badge " +
                      (article.status === "published"
                        ? "admin-badge-published"
                        : "admin-badge-draft")
                    }
                  >
                    {article.status}
                  </span>
                </td>
                <td
                  style={{
                    color: "var(--sb-muted)",
                    fontSize: "0.8125rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {article.dateISO ?? "—"}
                </td>
                <td>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="admin-btn-action"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ marginLeft: "0.25rem" }}
                    >
                      <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="15 3 21 3 21 9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="10"
                        y1="14"
                        x2="21"
                        y2="3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Link>
                </td>
                <td>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="admin-btn-action"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
