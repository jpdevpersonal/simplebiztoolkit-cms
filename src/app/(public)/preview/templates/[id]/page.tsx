import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";

import { getAdminApiService } from "@/app/admin/_lib/getAdminApiService";
import ProductDetailClient from "@/app/(public)/templates/[categorySlug]/[productSlug]/ProductDetailClient";
import RelatedLinksBlock from "@/components/RelatedLinksBlock";
import { extractRelatedLinksBlocksFromHtml } from "@/lib/relatedLinks";

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
    redirect("/cms/login");
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

  const contentSource = product.description || product.problem;
  const { blocks: relatedLinksBlocks } = extractRelatedLinksBlocksFromHtml(
    contentSource || "",
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
                { name: "Templates", href: "/templates" },
                { name: category.name, href: `/templates/${category.slug}` },
                {
                  name: product.title,
                  href: `/templates/${category.slug}/${product.slug ?? product.id}`,
                },
              ]}
            />
          ) : null}

          <ProductDetailClient product={product} />
          {relatedLinksBlocks.length > 0 ? (
            <div style={{ paddingTop: "1rem" }}>
              {relatedLinksBlocks.map((block, index) => (
                <RelatedLinksBlock
                  key={`${block.title}-${index}`}
                  title={block.title}
                  items={block.items}
                  backgroundColor={block.backgroundColor}
                  borderWidth={block.borderWidth}
                  imageSize={block.imageSize}
                  variant="template"
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
