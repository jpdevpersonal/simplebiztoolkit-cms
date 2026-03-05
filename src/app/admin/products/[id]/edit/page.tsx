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
          <Link
            href="/admin/products"
            className="admin-breadcrumb-link"
            style={{ fontSize: "1rem" }}
          >
            ← Templates
          </Link>
        </div>
        <h1>Edit Template</h1>
      </div>
      <span className="admin-page-meta">ID: {id}</span>
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
        <div className="admin-page-footer-link">
          <Link href="/admin/products" className="admin-breadcrumb-link">
            ← Templates
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader id={id} />
      <ProductEditor product={product} categories={categories} />
      <div className="admin-page-footer-link">
        <Link href="/admin/products" className="admin-breadcrumb-link">
          ← Templates
        </Link>
      </div>
    </div>
  );
}
