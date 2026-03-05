/**
 * New Product Page
 */

import Link from "next/link";
import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import ProductEditor from "@/components/ProductEditor";

export default async function NewProductPage() {
  const { service } = await getAdminApiService();
  const categoriesResponse = await service.getProductCategories();
  const categories = categoriesResponse.data || [];

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <div className="admin-breadcrumb">
            <Link href="/admin/products" className="admin-breadcrumb-link">
              ← Templates
            </Link>
          </div>
          <h1>New Template</h1>
        </div>
      </div>
      <ProductEditor categories={categories} />
    </div>
  );
}
