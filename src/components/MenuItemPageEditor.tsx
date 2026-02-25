"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItemPage } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import RichContentField from "@/components/RichContentField";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

type Props = {
  page?: MenuItemPage;
  menuCategoryId: string;
  isNew?: boolean;
};

export default function MenuItemPageEditor({
  page,
  menuCategoryId,
  isNew = false,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: page?.title ?? "",
    subtitle: page?.subtitle ?? "",
    slug: page?.slug ?? "",
    description: page?.description ?? "",
    content: page?.content ?? "",
    category: page?.category ?? "",
    featuredImage: page?.featuredImage ?? "",
    headerImage: page?.headerImage ?? "",
    status: page?.status ?? "draft",
    dateISO: page?.dateISO ?? today,
    seoTitle: page?.seoTitle ?? "",
    seoDescription: page?.seoDescription ?? "",
    ogImage: page?.ogImage ?? "",
    canonicalUrl: page?.canonicalUrl ?? "",
  });

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Auto-generate slug from title when creating
  useEffect(() => {
    if (isNew && formData.title && !formData.slug) {
      const generated = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      update("slug", generated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.title, isNew]);

  const backHref = `/admin/menu/categories/${menuCategoryId}/pages`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload: Partial<MenuItemPage> = {
        ...formData,
        menuCategoryId,
        dateModified: today,
      };

      if (isNew) {
        await clientApi.createMenuItemPage(payload);
        router.push(backHref);
        router.refresh();
      } else if (page?.id) {
        await clientApi.updateMenuItemPage(page.id, payload);
        setMessage("Page saved successfully!");
        router.refresh();
      } else {
        throw new Error("Missing page id for update");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this page?")) return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuItemPage(page!.id);
      router.push(backHref);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  const contentIcon = (
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
  );

  const seoIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="m21 21-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const mediaIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" />
      <polyline
        points="21 15 16 10 5 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const publishIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit}>
      <EditorFeedback message={message} error={error} />

      <div className="row g-3">
        {/* Main column */}
        <div className="col-lg-8">
          <AdminFormBlock
            icon={contentIcon}
            title="Page Content"
            className="mb-0"
          >
            <div className="mb-3">
              <label className="form-label fw-semibold">Title *</label>
              <input
                className="form-control"
                value={formData.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Subtitle</label>
              <input
                className="form-control"
                value={formData.subtitle}
                onChange={(e) => update("subtitle", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Slug *</label>
              <input
                className="form-control"
                value={formData.slug}
                onChange={(e) => update("slug", e.target.value)}
                required
              />
              <div className="form-text">
                URL path segment, e.g. <code>getting-started</code>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Description</label>
              <textarea
                className="form-control"
                value={formData.description}
                onChange={(e) => update("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Category</label>
              <input
                className="form-control"
                value={formData.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="Optional category tag"
              />
            </div>

            <div>
              <RichContentField
                label="Content"
                storageKey="menu-item-page-content-mode"
                value={formData.content}
                onChange={(val) => update("content", val)}
              />
            </div>
          </AdminFormBlock>
        </div>

        {/* Sidebar column */}
        <div className="col-lg-4">
          {/* Publish settings */}
          <AdminFormBlock icon={publishIcon} title="Publish">
            <div className="mb-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="form-label fw-semibold">Publish Date</label>
              <input
                type="date"
                className="form-control"
                value={formData.dateISO}
                onChange={(e) => update("dateISO", e.target.value)}
              />
            </div>
          </AdminFormBlock>

          {/* Media */}
          <AdminFormBlock icon={mediaIcon} title="Media">
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Featured Image URL
              </label>
              <input
                className="form-control"
                value={formData.featuredImage}
                onChange={(e) => update("featuredImage", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="form-label fw-semibold">Header Image URL</label>
              <input
                className="form-control"
                value={formData.headerImage}
                onChange={(e) => update("headerImage", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </AdminFormBlock>

          {/* SEO */}
          <AdminFormBlock icon={seoIcon} title="SEO" className="mb-0">
            <div className="mb-3">
              <label className="form-label fw-semibold">SEO Title</label>
              <input
                className="form-control"
                value={formData.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">SEO Description</label>
              <textarea
                className="form-control"
                value={formData.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                rows={3}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">OG Image URL</label>
              <input
                className="form-control"
                value={formData.ogImage}
                onChange={(e) => update("ogImage", e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="form-label fw-semibold">Canonical URL</label>
              <input
                className="form-control"
                value={formData.canonicalUrl}
                onChange={(e) => update("canonicalUrl", e.target.value)}
                placeholder="https://..."
              />
            </div>
          </AdminFormBlock>
        </div>
      </div>

      <EditorActions
        saving={saving}
        isCreateMode={isNew}
        entityName="Page"
        onCancel={() => router.push(backHref)}
        onDelete={!isNew && page ? handleDelete : undefined}
        deleting={deleting}
      />
    </form>
  );
}
