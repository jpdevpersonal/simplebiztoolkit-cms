import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import ProductDetailClient from "@/app/(public)/products/[categorySlug]/[productSlug]/ProductDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Template Preview | Simple Biz Toolkit",
  robots: "noindex, nofollow",
};

export default async function ProductPreviewPage({ params }: Props) {
  const { id } = await params;
  const { service, session } = await getAdminApiService();

  if (!session) {
    redirect("/admin/login");
  }

  const [productResponse, categoriesResponse] = await Promise.all([
    service.getProductById(id),
    service.getProductCategories(),
  ]);

  if (!productResponse.data) {
    notFound();
  }

  const product = productResponse.data;
  const category = (categoriesResponse.data ?? []).find(
    (candidate) => candidate.id === product.categoryId,
  );

  return (
    <>
      <section className="container pt-4">
        <div className="alert alert-warning mb-0" role="status">
          Previewing saved {product.status ?? "draft"} template.
        </div>
      </section>

      <section className="sb-section">
        <div className="container">
          {category ? (
            <nav className="sb-breadcrumb" aria-label="Breadcrumb">
              <Link
                href={`/products/${category.slug}`}
                className="sb-breadcrumb-link"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                  className="sb-breadcrumb-icon"
                >
                  <path
                    d="M10 3l-5 5 5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back to {category.name}
              </Link>
            </nav>
          ) : null}

          <ProductDetailClient product={product} />
        </div>
      </section>
    </>
  );
}
