/**
 * Edit Article Page
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import ArticleEditor from "../../ArticleEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;

  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getArticleById(id);

  if (!response.data) {
    notFound();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div
            style={{
              fontSize: "0.8125rem",
              color: "var(--sb-muted)",
              marginBottom: "0.25rem",
            }}
          >
            <Link
              href="/admin/articles"
              style={{ color: "var(--sb-muted)", textDecoration: "none" }}
            >
              ← Articles
            </Link>
          </div>
          <h1>Edit Article</h1>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--sb-muted)",
            background: "#f1f3f5",
            borderRadius: "999px",
            padding: "0.25rem 0.75rem",
            fontWeight: 600,
          }}
        >
          ID: {id}
        </span>
      </div>
      <ArticleEditor article={response.data} />
    </div>
  );
}
