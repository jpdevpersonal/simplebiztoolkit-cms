/**
 * New Article Page
 */

import ArticleEditor from "../ArticleEditor";

export default function NewArticlePage() {
  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>
        Create New Article
      </h1>
      <ArticleEditor isNew />
    </div>
  );
}
