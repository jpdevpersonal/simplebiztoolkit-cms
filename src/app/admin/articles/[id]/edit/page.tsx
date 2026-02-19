/**
 * Edit Article Page
 */

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

  // Ensure cookies are available for NextAuth on the server
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
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Article</h1>
      <ArticleEditor article={response.data} />
    </div>
  );
}
