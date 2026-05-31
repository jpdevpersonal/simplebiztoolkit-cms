"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";
import ConfirmDialog from "@/components/ConfirmDialog";
import EditorFeedback from "@/components/EditorFeedback";

type Props = {
  category?: ProductCategory;
  isNew?: boolean;
};

export default function CategoryEditor({ category, isNew = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [summary, setSummary] = useState(category?.summary || "");
  const [howThisHelps, setHowThisHelps] = useState(
    category?.howThisHelps || "",
  );
  const [heroImage, setHeroImage] = useState(category?.heroImage || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useUnsavedChangesWarning(isDirty && !saving && !deleting);

  const markDirty = () => setIsDirty(true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = {
        name,
        slug,
        summary,
        howThisHelps,
        heroImage,
      };

      if (isNew) {
        await clientApi.createCategory(payload);
        setIsDirty(false);
        router.push("/cms/categories");
        router.refresh();
      } else if (category?.id) {
        await clientApi.updateCategory(category.id, payload);
        setIsDirty(false);
        setMessage("Category saved successfully!");
        router.refresh();
      } else {
        throw new Error("Missing category id for update");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setConfirmDeleteOpen(false);
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteCategory(category!.id);
      setIsDirty(false);
      router.push("/cms/categories");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Fields */}
      <div className="admin-form-block">
        <div className="admin-form-block-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <span className="admin-form-block-title">Category Details</span>
        </div>
        <div className="admin-form-block-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Name *</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => {
                  markDirty();
                  setName(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Slug *</label>
              <input
                className="form-control"
                value={slug}
                onChange={(e) => {
                  markDirty();
                  setSlug(e.target.value);
                }}
                required
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Summary</label>
              <textarea
                className="form-control"
                value={summary}
                onChange={(e) => {
                  markDirty();
                  setSummary(e.target.value);
                }}
                rows={3}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">How this helps</label>
              <textarea
                className="form-control"
                value={howThisHelps}
                onChange={(e) => {
                  markDirty();
                  setHowThisHelps(e.target.value);
                }}
                rows={4}
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">Hero Image URL</label>
              <input
                className="form-control"
                value={heroImage}
                onChange={(e) => {
                  markDirty();
                  setHeroImage(e.target.value);
                }}
                placeholder="/images/..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status messages */}
      <EditorFeedback message={message} error={error} />

      {/* Actions */}
      <div className="admin-form-actions">
        <div className="admin-form-actions-primary">
          <button type="submit" className="admin-btn-save" disabled={saving}>
            {saving ? "Saving..." : isNew ? "Create Category" : "Save Changes"}
          </button>
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
        {!isNew && (
          <button
            type="button"
            className="admin-btn-danger"
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Category"}
          </button>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Delete category"
        message="Are you sure you want to delete this category? This cannot be undone."
        confirmLabel="Delete category"
        destructive
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </form>
  );
}
