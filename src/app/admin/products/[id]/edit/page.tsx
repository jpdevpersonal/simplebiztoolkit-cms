/**
 * Edit Product Page
 */

import Link from "next/link";
import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import ProductEditor from "@/components/ProductEditor";
import ProductEditorLoader from "@/components/ProductEditorLoader";

type Props = {
  params: Promise<{ id: string }>;
};

function PageHeader({ id }: { id: string }) {
  return (
    <div className="admin-page-header">
      <div>
        <div className="admin-breadcrumb">
          <Link href="/admin/products" className="admin-breadcrumb-link">
            ← Products
          </Link>
        </div>
        <h1>Edit Product</h1>
      </div>
      <span
        style={{
          fontSize: "0.75rem",
          color: "var(--sb-muted)",
          background: "#f1f3f5",
          borderRadius: "999px",
          padding: "0.25rem 0.75rem",
          fontWeight: 600,
        }}
      >
        ID: {id}
      </span>
    </div>
  );
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  const categoriesResponse = await service.getProductCategories();
  const categories = categoriesResponse.data || [];

  const response = await service.getProductById(id);
  let product = response.data;

  if (!product) {
    product = categories
      .flatMap((category) => category.items || [])
      .find((item) => item.id === id);
  }

  if (!product) {
    return (
      <div>
        <PageHeader id={id} />
        <ProductEditorLoader id={id} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader id={id} />
      <ProductEditor product={product} categories={categories} />
    </div>
  );
}
