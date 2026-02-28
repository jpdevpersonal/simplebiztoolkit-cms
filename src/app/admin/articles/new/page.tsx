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
          <div className="admin-breadcrumb">
            <Link href="/admin/articles" className="admin-breadcrumb-link">
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
