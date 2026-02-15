/**
 * Edit Product Page
 */

import { headers } from "next/headers";
import { apiService, getApiService } from "@/lib/api";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import ProductEditor from "@/components/ProductEditor";
import ProductEditorLoader from "@/components/ProductEditorLoader";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  // Ensure cookies available for NextAuth on the server
  await headers();
  const session = await auth();
  const _s = session as Session & { accessToken?: string };
  const accessToken = _s?.accessToken;
  const service = accessToken ? getApiService(accessToken) : apiService;

  // Fetch both the product and categories using authenticated service when possible
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
    // If server couldn't find the product (e.g., draft requiring cookies),
    // fall back to a client-side loader which will fetch with credentials.
    return (
      <div>
        <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Product</h1>
        <ProductEditorLoader id={id} />
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Product</h1>
      {/* ProductEditor is a client component that handles the form and update */}
      <ProductEditor product={product} categories={categories} />
    </div>
  );
}
