/**
 * New Article Page
 */

import Link from "next/link";
import ArticleEditor from "../ArticleEditor";

export default function NewArticlePage() {
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
          <h1>New Article</h1>
        </div>
      </div>
      <ArticleEditor isNew />
    </div>
  );
}
