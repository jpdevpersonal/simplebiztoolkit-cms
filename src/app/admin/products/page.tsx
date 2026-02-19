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
      {/* Page header */}
      <div className="admin-page-header">
        <h1>Products</h1>
        <Link href="/admin/products/new" className="admin-btn-save">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <line
              x1="12"
              y1="5"
              x2="12"
              y2="19"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="5"
              y1="12"
              x2="19"
              y2="12"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          New Product
        </Link>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <AdminStatCard
            label="Total Products"
            value={products.length}
            valueSize="lg"
          />
        </div>
        <div className="col-6">
          <AdminStatCard
            label="Categories"
            value={categories.length}
            valueSize="lg"
          />
        </div>
      </div>

      {/* Product Table (client-side for sorting) */}
      <AdminProductsTable products={products} categories={categories} />
    </div>
  );
}
