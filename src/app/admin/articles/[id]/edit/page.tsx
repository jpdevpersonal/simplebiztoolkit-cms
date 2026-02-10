/**
 * Edit Article Page
 */

import { notFound } from "next/navigation";
import { apiService } from "@/lib/api";
import ArticleEditor from "../../ArticleEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;
  const response = await apiService.getArticleById(id);

  if (!response.data) {
    notFound();
  }

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Article</h1>
      <ArticleEditor article={response.data} />
    </div>
  );
}
