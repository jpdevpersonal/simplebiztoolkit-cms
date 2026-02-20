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
import AdminArticlesTable from "@/components/AdminArticlesTable";

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
      <AdminArticlesTable articles={articles} />
    </div>
  );
}
