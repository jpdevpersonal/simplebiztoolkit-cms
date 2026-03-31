import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";

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
            <SiteBreadcrumb
              items={[
                { name: "Home", href: "/" },
                { name: "Products", href: "/products" },
                { name: category.name, href: `/products/${category.slug}` },
                {
                  name: product.title,
                  href: `/products/${category.slug}/${product.slug ?? product.id}`,
                },
              ]}
            />
          ) : null}

          <ProductDetailClient product={product} />
        </div>
      </section>
    </>
  );
}
