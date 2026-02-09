import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/ProductGrid";
import { categories } from "@/data/products";
import { links } from "@/config/links";
import { site } from "@/config/site";
import "@/styles/products.css";

type Props = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateStaticParams() {
  return categories.map((c) => ({ categorySlug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params;
  const cat = categories.find((c) => c.slug === categorySlug);
  if (!cat) return {};

  const title = `${cat.name} | Simple Biz Toolkit`;
  const description = `${cat.summary} Browse templates and then checkout securely on Etsy.`;

  return {
    title: cat.name,
    description,
    alternates: { canonical: `/products/${cat.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${cat.slug}`,
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const cat = categories.find((c) => c.slug === categorySlug);

  if (!cat) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.name} | Simple Biz Toolkit`,
    url: `https://simplebiztoolkit.com/products/${cat.slug}`,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: site.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Products",
        item: `${site.url}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.name,
        item: `${site.url}/products/${cat.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd json={jsonLd} />
      <JsonLd json={breadcrumbJsonLd} />

      <section className="sb-section">
        <div className="container">
          <nav className="sb-breadcrumb" aria-label="Breadcrumb">
            <Link href="/products" className="sb-breadcrumb-link">
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
              Back to Categories
            </Link>
          </nav>

          <div className="row g-4 align-items-center">
            <div className="col-lg-7">
              <h1 style={{ fontWeight: 700 }}>{cat.name}</h1>
              <p className="sb-muted fs-5">{cat.summary}</p>

              <div
                className="sb-card p-3"
                style={{ borderLeft: "3px solid var(--sb-brand-blue)" }}
              >
                <h2
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    marginBottom: "0.35rem",
                  }}
                >
                  How this helps
                </h2>
                <p className="sb-muted mb-0" style={{ fontSize: "0.9375rem" }}>
                  {cat.howThisHelps}
                </p>
              </div>
            </div>

            <div className="col-lg-5">
              {cat.heroImage ? (
                <div className="sb-card p-3">
                  <Image
                    src={cat.heroImage}
                    alt=""
                    className="img-fluid rounded-4"
                    width={900}
                    height={630}
                    sizes="(max-width: 992px) 100vw, 420px"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div id="items" className="mt-4">
            <ProductGrid products={cat.items} />
          </div>
          <div className="mt-3 d-flex gap-2 flex-wrap">
            <a
              className="btn sb-btn-ghost"
              href={links.etsyShopUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit our Etsy shop
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
