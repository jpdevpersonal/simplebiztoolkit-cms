/**
 * Edit Category Page
 */

import Link from "next/link";
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
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/categories" className="admin-breadcrumb-link">
              ← Categories
            </Link>
          </div>
          <h1>Edit Category</h1>
        </div>
        <span
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--sb-brand-blue)",
          }}
        >
          {category.name}
        </span>
      </div>
      <CategoryEditor category={category} />
    </div>
  );
}
