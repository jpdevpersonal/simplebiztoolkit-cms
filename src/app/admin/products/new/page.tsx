/**
 * New Product Page
 */

import { apiService } from "@/lib/api";
import NewProductForm from "./NewProductForm";

export default async function NewProductPage() {
  // Fetch categories for the dropdown
  const categoriesResponse = await apiService.getProductCategories();
  const categories = categoriesResponse.data || [];

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>New Product</h1>
      <NewProductForm categories={categories} />
    </div>
  );
}
