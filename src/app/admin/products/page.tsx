/**
 * Products List Page - Admin
 * Lists all products across categories
 */

import Link from "next/link";
import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import AdminProductsTable from "../../../components/AdminProductsTable";
import AdminStatCard from "@/components/AdminStatCard";

export default async function ProductsPage() {
  // Ensure cookies are available for NextAuth on the server
  await headers();
  const session = await auth();

  // Use an authenticated API service when session has an accessToken so drafts are returned
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const response = await service.getAllProducts();
  const categories = response.data || [];
  const products = categories.flatMap((cat) => cat.items || []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 style={{ fontWeight: 700 }}>Products</h1>
        <Link href="/admin/products/new" className="btn sb-btn-primary">
          + New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <AdminStatCard label="Total Products" value={products.length} />
        </div>
        <div className="col-md-6">
          <AdminStatCard label="Categories" value={categories.length} />
        </div>
      </div>

      {/* Product Table (client-side for sorting) */}
      <AdminProductsTable products={products} categories={categories} />
    </div>
  );
}
