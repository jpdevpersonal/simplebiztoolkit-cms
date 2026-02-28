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
import { clientApi } from "@/lib/clientApi";
import RichContentField from "@/components/RichContentField";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

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

      if (isNew) {
        await clientApi.createArticle(payload);
      } else if (article?.id) {
        await clientApi.updateArticle(article.id, payload);
      } else {
        throw new Error("Missing article id for update");
      }

      // Trigger revalidation
      await clientApi.revalidateContent("article", formData.slug);

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
      <EditorFeedback error={error} />

      <div className="row g-3">
        {/* Main Column */}
        <div className="col-lg-8">
          {/* Content block */}
          <AdminFormBlock
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="14 2 14 8 20 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="Article Content"
            className="mb-0"
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Title *</label>
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
              <label className="form-label fw-semibold">Subtitle</label>
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
              <label className="form-label fw-semibold">Slug *</label>
              <div className="input-group">
                <span
                  className="input-group-text"
                  style={{ fontSize: "0.875rem", color: "var(--sb-muted)" }}
                >
                  /blog/
                </span>
                <input
                  type="text"
                  className="form-control"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Description *</label>
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

            <div className="mb-0">
              <RichContentField
                label="Content"
                value={formData.content}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, content: html }))
                }
                storageKey="article-content-editor-mode"
                required
                htmlRows={20}
                minHeight={420}
                placeholder="Start writing your article content here…"
                hint={
                  <>
                    Use{" "}
                    <code>
                      &lt;section data-component=&quot;section&quot;&gt;
                    </code>{" "}
                    and{" "}
                    <code>
                      &lt;aside data-component=&quot;callout&quot;
                      data-title=&quot;Title&quot;&gt;
                    </code>{" "}
                    or{" "}
                    <code>
                      &lt;section data-component=&quot;article-cta&quot;
                      data-title=&quot;Ready?&quot;
                      data-description=&quot;...&quot;
                      data-primary-label=&quot;Explore&quot;
                      data-primary-href=&quot;https://...&quot;
                      data-show-home-link=&quot;true&quot;
                      data-show-etsy-link=&quot;false&quot;&gt;&lt;/section&gt;
                    </code>
                  </>
                }
              />
            </div>
          </AdminFormBlock>
        </div>

        {/* Sidebar Column */}
        <div className="col-lg-4">
          {/* Settings block */}
          <AdminFormBlock
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            title="Settings"
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Status *</label>
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
              <label className="form-label fw-semibold">Category *</label>
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
              <label className="form-label fw-semibold">
                Reading Time (min)
              </label>
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
              <label className="form-label fw-semibold">
                Badges{" "}
                <span style={{ fontWeight: 400, color: "var(--sb-muted)" }}>
                  (comma-separated)
                </span>
              </label>
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
              <label className="form-label fw-semibold">
                Featured Image URL
              </label>
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

            <div className="mb-0">
              <label className="form-label fw-semibold">Header Image URL</label>
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
          </AdminFormBlock>

          {/* SEO block */}
          <AdminFormBlock
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="11"
                  cy="11"
                  r="8"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="21"
                  y1="21"
                  x2="16.65"
                  y2="16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            title="SEO"
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">SEO Title</label>
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

            <div className="mb-0">
              <label className="form-label fw-semibold">SEO Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.seoDescription}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seoDescription: e.target.value,
                  })
                }
                placeholder="Leave blank to use article description"
              />
            </div>
          </AdminFormBlock>
        </div>
      </div>

      {/* Actions */}
      <EditorActions
        saving={loading}
        isCreateMode={isNew}
        entityName="Article"
        onCancel={() => router.back()}
      />
    </form>
  );
}
