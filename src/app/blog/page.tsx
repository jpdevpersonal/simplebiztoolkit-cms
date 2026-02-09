import type { Metadata } from "next";
import Link from "next/link";

import JsonLd from "@/components/JsonLd";
import { site } from "@/config/site";
import { posts } from "@/data/posts";
import "@/styles/blog.css";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Guides and tips for small business owners and Etsy sellers. Essential advice that links to tools you can use immediately.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Resources | Simple Biz Toolkit",
    description:
      "Guides and tips for small business owners and Etsy sellers. Essential advice that links to tools you can use immediately.",
    url: "/blog",
    images: ["/images/hero-image-desk.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources | Simple Biz Toolkit",
    description:
      "Guides and tips for small business owners and Etsy sellers. Essential advice that links to tools you can use immediately.",
    images: ["/images/hero-image-desk.webp"],
  },
};

export default function BlogIndexPage() {
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
        name: "Resources",
        item: `${site.url}/blog`,
      },
    ],
  };

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Resources | Simple Biz Toolkit",
    url: `${site.url}/blog`,
  };

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={collectionJsonLd} />
      <section className="sb-section">
        <div className="container">
          <h1 style={{ fontWeight: 900 }}>Resources</h1>
          <p className="sb-muted">
            Essential guides and tips for small business owners and online
            sellers.
          </p>

          <div className="row g-3 mt-2">
            {posts.map((p) => (
              <div className="col-lg-6" key={p.slug}>
                <div className="sb-card p-3 h-100">
                  {p.featuredImage && (
                    <div className="blog-card-image">
                      <Link href={`/blog/${p.slug}`}>
                        <img
                          src={p.featuredImage}
                          alt={p.title}
                          style={{
                            width: "100%",
                            height: "auto",
                            borderRadius: "8px",
                            marginBottom: "12px",
                            objectFit: "contain",
                            backgroundColor: "#f8f9fa",
                          }}
                        />
                      </Link>
                    </div>
                  )}
                  <div className="d-flex justify-content-between gap-2 flex-wrap">
                    <div className="sb-muted" style={{ fontSize: 13 }}>
                      {p.category}
                    </div>
                    <div className="sb-muted" style={{ fontSize: 13 }}>
                      {p.readingMinutes} min read
                    </div>
                  </div>

                  <div
                    className="mt-1"
                    style={{ fontWeight: 900, fontSize: 18 }}
                  >
                    {p.title}
                  </div>
                  <div className="sb-muted mt-1">{p.description}</div>

                  <div className="mt-3">
                    <Link className="sb-article-link" href={`/blog/${p.slug}`}>
                      <span>Read article</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 5l7 7-7 7"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
