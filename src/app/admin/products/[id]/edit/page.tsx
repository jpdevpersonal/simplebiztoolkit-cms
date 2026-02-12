/**
 * Edit Product Page
 */

import { notFound } from "next/navigation";
import { apiService } from "@/lib/api";
import ProductEditor from "@/components/ProductEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const response = await apiService.getProductById(id);

  if (!response.data) {
    notFound();
  }

  return (
    <div>
      <h1 style={{ fontWeight: 700, marginBottom: "2rem" }}>Edit Product</h1>
      {/* ProductEditor is a client component that handles the form and update */}
      <ProductEditor product={response.data} />
    </div>
  );
}
