/**
 * Edit Category Page
 */

import { notFound } from "next/navigation";
import { apiService } from "@/lib/api";
import CategoryEditor from "@/components/CategoryEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: Props) {
  const { id } = await params;

  const response = await apiService.getProductCategories();
  const categories = response.data || [];

  const category = categories.find((c) => c.id === id);

  if (!category) {
    notFound();
  }

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Category</h1>
      <CategoryEditor category={category} />
    </div>
  );
}
