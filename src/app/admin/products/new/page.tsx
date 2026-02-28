/**
 * New Product Page
 */

import Link from "next/link";
import { apiService } from "@/lib/api";
import ProductEditor from "@/components/ProductEditor";

export default async function NewProductPage() {
  const categoriesResponse = await apiService.getProductCategories();
  const categories = categoriesResponse.data || [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/products" className="admin-breadcrumb-link">
              ← Products
            </Link>
          </div>
          <h1>New Product</h1>
        </div>
      </div>
      <ProductEditor categories={categories} />
    </div>
  );
}
