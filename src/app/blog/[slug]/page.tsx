import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import JsonLd from "@/components/JsonLd";
import { posts } from "@/data/posts";
import { ArticleContent, hasArticleContent } from "../articles";
import "@/styles/articleStyle.css";
import { site } from "@/config/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return {};

  const ogImage = post.featuredImage ?? "/images/hero-image-desk.webp";

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} | Simple Biz Toolkit`,
      description: post.description,
      url: `/blog/${post.slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | Simple Biz Toolkit`,
      description: post.description,
      images: [ogImage],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  if (!post) notFound();

  if (!hasArticleContent(slug)) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.dateISO,
    dateModified: post.dateISO,
    image: post.headerImage
      ? [`https://simplebiztoolkit.com${post.headerImage}`]
      : undefined,
    author: { "@type": "Person", name: "Julian (Simple Biz Toolkit)" },
    publisher: {
      "@type": "Organization",
      name: site.name,
      url: site.url,
    },
  };

  return (
    <>
      <JsonLd json={articleJsonLd} />

      <main className="article-page">
        <nav className="sb-breadcrumb" aria-label="Breadcrumb">
          <Link href="/blog" className="sb-breadcrumb-link">
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
            {post.badges?.map((b) => (
              <span key={b} className="article-badge">
                {b}
              </span>
            ))}
          </div>

          <h1 className="article-title">{post.title}</h1>
          {post.subtitle && <p className="article-subtitle">{post.subtitle}</p>}

          <div className="article-meta">
            <time dateTime={post.dateISO}>Published {post.dateISO}</time>
            <span> · </span>
            <span>{post.readingMinutes} min read</span>
          </div>
        </header>

        {/* Header Image */}
        {post.headerImage && (
          <div className="article-header-image">
            <img src={post.headerImage} alt={post.title} />
          </div>
        )}

        {/* Article Content */}
        <article>
          <ArticleContent slug={slug} />
        </article>

        {/* Duplicate breadcrumb at bottom of main content */}
        <nav
          className="sb-breadcrumb sb-breadcrumb--bottom"
          aria-label="Breadcrumb"
        >
          <Link href="/blog" className="sb-breadcrumb-link">
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
