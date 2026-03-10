import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import Image from "next/image";
import { ContentRenderer } from "@/components/ContentRenderer";
import { apiService } from "@/lib/api";
import "@/styles/articleStyle.css";
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  createPageMetadata,
} from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

/**
 * Generate static params for ISR
 * This still pre-renders pages at build time
 */
export async function generateStaticParams() {
  const response = await apiService.getArticles();

  if (!response.data) {
    return [];
  }

  return response.data.map((article) => ({ slug: article.slug }));
}

/**
 * Generate metadata for SEO
 * Fetches article data from API
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const response = await apiService.getArticleBySlug(slug);

  if (!response.data) return {};

  const article = response.data;

  const ogImage =
    article.ogImage || article.featuredImage || "/images/hero-image-desk.webp";

  return createPageMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.description,
    pathname: `/blog/${article.slug}`,
    canonical: article.canonicalUrl || undefined,
    image: ogImage,
    openGraphType: "article",
  });
}

/**
 * Blog Post Page Component
 * Fetches article content from API with ISR
 */
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const response = await apiService.getArticleBySlug(slug);

  if (!response.data) notFound();

  const article = response.data;

  const articleJsonLd = createArticleJsonLd({
    headline: article.title,
    description: article.description,
    href: `/blog/${article.slug}`,
    datePublished: article.dateISO,
    dateModified: article.dateModified,
    image: article.headerImage,
  });
  const breadcrumbJsonLd = createBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Resources", href: "/blog" },
    { name: article.title, href: `/blog/${article.slug}` },
  ]);

  return (
    <>
      <JsonLd json={breadcrumbJsonLd} />
      <JsonLd json={articleJsonLd} />

      <main className="article-page">
        <nav className="sb-breadcrumb" aria-label="Breadcrumb">
          <Link href="/blog" className="sb-breadcrumb-link" prefetch={false}>
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
            Back to Resources
          </Link>
        </nav>

        <header className="article-header">
          <div className="article-badges">
            {article.badges?.map((b) => (
              <span key={b} className="article-badge">
                {b}
              </span>
            ))}
          </div>

          <h1 className="article-title">{article.title}</h1>
          {article.subtitle && (
            <p className="article-subtitle">{article.subtitle}</p>
          )}

          <div className="article-meta">
            <time dateTime={article.dateISO}>Published {article.dateISO}</time>
            <span> · </span>
            <span>{article.readingMinutes} min read</span>
          </div>
        </header>

        {/* Header Image */}
        {article.headerImage && (
          <div className="article-header-image">
            <Image
              src={article.headerImage}
              alt={article.title}
              width={1200}
              height={630}
              sizes="(max-width: 768px) 100vw, 1200px"
              loading="lazy"
              style={{ width: "100%", height: "auto" }}
            />
          </div>
        )}

        {/* Article Content - Now renders from database HTML */}
        <article>
          <ContentRenderer html={article.content} />
        </article>

        {/* Duplicate breadcrumb at bottom of main content */}
        <nav
          className="sb-breadcrumb sb-breadcrumb--bottom"
          aria-label="Breadcrumb"
        >
          <Link href="/blog" className="sb-breadcrumb-link" prefetch={false}>
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
            Back to Resources
          </Link>
        </nav>
      </main>
    </>
  );
}
