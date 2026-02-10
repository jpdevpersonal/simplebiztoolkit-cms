/**
 * Article Editor - Client Component
 * Rich text editor for creating/editing articles
 *
 * NOTE: This is a basic implementation. In production, use TipTap or similar.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/api";

interface ArticleEditorProps {
  article?: Article;
  isNew?: boolean;
}

export default function ArticleEditor({
  article,
  isNew = false,
}: ArticleEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: article?.title || "",
    subtitle: article?.subtitle || "",
    slug: article?.slug || "",
    description: article?.description || "",
    content: article?.content || "",
    category: article?.category || "Bookkeeping",
    readingMinutes: article?.readingMinutes || 5,
    badges: article?.badges?.join(", ") || "",
    featuredImage: article?.featuredImage || "",
    headerImage: article?.headerImage || "",
    status: article?.status || "draft",
    seoTitle: article?.seoTitle || "",
    seoDescription: article?.seoDescription || "",
    ogImage: article?.ogImage || "",
    canonicalUrl: article?.canonicalUrl || "",
  });

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && formData.title && !formData.slug) {
      const generatedSlug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, isNew, formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        badges: formData.badges
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
      };

      const url = isNew
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/articles`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/articles/${article?.id}`;

      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save article");

      // Trigger revalidation
      await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Revalidation-Secret":
            process.env.NEXT_PUBLIC_REVALIDATION_SECRET || "",
        },
        body: JSON.stringify({ type: "article", slug: formData.slug }),
      });

      router.push("/admin/articles");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4">
        {/* Main Column */}
        <div className="col-lg-8">
          <div className="sb-card p-4 mb-4">
            <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>
              Article Content
            </h3>

            <div className="mb-3">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-control"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                className="form-control"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, subtitle: e.target.value })
                }
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Slug *</label>
              <input
                type="text"
                className="form-control"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
              <small className="sb-muted">URL: /blog/{formData.slug}</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Content (HTML) *</label>
              <textarea
                className="form-control"
                rows={20}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
              <small className="sb-muted">
                Use data attributes:
                <code>&lt;section data-component="section"&gt;</code> and
                <code>
                  &lt;aside data-component="callout" data-title="Title"&gt;
                </code>
              </small>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="col-lg-4">
          <div className="sb-card p-4 mb-4">
            <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>
              Settings
            </h3>

            <div className="mb-3">
              <label className="form-label">Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "draft" | "published",
                  })
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="Bookkeeping">Bookkeeping</option>
                <option value="Productivity">Productivity</option>
                <option value="Etsy Selling">Etsy Selling</option>
                <option value="Branding">Branding</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Reading Time (minutes)</label>
              <input
                type="number"
                className="form-control"
                value={formData.readingMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    readingMinutes: parseInt(e.target.value),
                  })
                }
                min="1"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Badges (comma-separated)</label>
              <input
                type="text"
                className="form-control"
                value={formData.badges}
                onChange={(e) =>
                  setFormData({ ...formData, badges: e.target.value })
                }
                placeholder="Bookkeeping, Small Business"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Featured Image URL</label>
              <input
                type="text"
                className="form-control"
                value={formData.featuredImage}
                onChange={(e) =>
                  setFormData({ ...formData, featuredImage: e.target.value })
                }
                placeholder="/images/..."
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Header Image URL</label>
              <input
                type="text"
                className="form-control"
                value={formData.headerImage}
                onChange={(e) =>
                  setFormData({ ...formData, headerImage: e.target.value })
                }
                placeholder="/images/..."
              />
            </div>
          </div>

          <div className="sb-card p-4 mb-4">
            <h3 style={{ fontWeight: 600, marginBottom: "1.5rem" }}>SEO</h3>

            <div className="mb-3">
              <label className="form-label">SEO Title</label>
              <input
                type="text"
                className="form-control"
                value={formData.seoTitle}
                onChange={(e) =>
                  setFormData({ ...formData, seoTitle: e.target.value })
                }
                placeholder="Leave blank to use article title"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">SEO Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.seoDescription}
                onChange={(e) =>
                  setFormData({ ...formData, seoDescription: e.target.value })
                }
                placeholder="Leave blank to use article description"
              />
            </div>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn sb-btn-primary flex-grow-1"
              disabled={loading}
            >
              {loading
                ? "Saving..."
                : isNew
                  ? "Create Article"
                  : "Update Article"}
            </button>
            <button
              type="button"
              className="btn sb-btn-ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
