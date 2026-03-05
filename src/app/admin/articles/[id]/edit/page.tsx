/**
 * Edit Article Page
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import ArticleEditor from "../../ArticleEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditArticlePage({ params }: Props) {
  const { id } = await params;

  const { service } = await getAdminApiService();

  const response = await service.getArticleById(id);

  if (!response.data) {
    notFound();
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/articles" className="admin-breadcrumb-link">
              ← Articles
            </Link>
          </div>
          <h1>Edit Article</h1>
        </div>
        <span className="admin-page-meta">ID: {id}</span>
      </div>
      <ArticleEditor article={response.data} />
    </div>
  );
}
