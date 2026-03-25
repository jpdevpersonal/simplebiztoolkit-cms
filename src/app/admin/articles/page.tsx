/**
 * Article List Page - Admin
 * Lists all articles with filtering by status
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import AdminStatCard from "@/components/AdminStatCard";
import AdminArticlesTable from "@/components/AdminArticlesTable";

export default async function ArticlesPage() {
  const { service } = await getAdminApiService();

  const response = await service.getAllArticles();
  const articles = response.data || [];

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");

  return (
    <div className="admin-page-shell">
      <div className="admin-page-header">
        <div className="admin-page-header-copy">
          <div className="admin-page-eyebrow">Publishing</div>
          <h1>Articles</h1>
          <p className="admin-page-description">
            Review live content, spot drafts quickly, and keep the publishing
            pipeline clear across screen sizes.
          </p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-page-meta">
            {articles.length} total articles
          </span>
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
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <AdminStatCard label="Total" value={articles.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Published" value={published.length} />
        </div>
        <div className="col-12 col-md-4">
          <AdminStatCard label="Drafts" value={drafts.length} />
        </div>
      </div>

      <section className="admin-section-card">
        <div className="admin-section-card-header">
          <div>
            <div className="admin-section-card-eyebrow">All entries</div>
            <h2 className="admin-section-card-title">Article library</h2>
            <p className="admin-section-card-copy">
              Sort by title, status, category, or date, then jump directly to
              the public preview or editor.
            </p>
          </div>
        </div>
        <AdminArticlesTable articles={articles} />
      </section>
    </div>
  );
}
