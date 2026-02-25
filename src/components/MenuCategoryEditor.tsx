"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

type Props = {
  category?: MenuCategory;
  menuItemId: string;
  isNew?: boolean;
};

export default function MenuCategoryEditor({
  category,
  menuItemId,
  isNew = false,
}: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(category?.title ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backHref = `/admin/menu/${menuItemId}/categories`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload: Partial<MenuCategory> = {
        title,
        description: description || undefined,
        menuItemId,
      };

      if (isNew) {
        await clientApi.createMenuCategory(payload);
        router.push(backHref);
        router.refresh();
      } else if (category?.id) {
        await clientApi.updateMenuCategory(category.id, payload);
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
    if (
      !confirm(
        "Are you sure you want to delete this category? All pages beneath it will also be deleted.",
      )
    )
      return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuCategory(category!.id);
      router.push(backHref);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  const detailsIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
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

      <AdminFormBlock icon={detailsIcon} title="Category Details">
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">Title *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Small Business Tools, Templates"
              required
            />
            <div className="form-text">
              This group label appears in the dropdown under its parent menu
              item.
            </div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description for this category"
            />
          </div>
        </div>
      </AdminFormBlock>

      {!isNew && category && (
        <AdminFormBlock
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
          title="Pages"
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--sb-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Manage the content pages that belong to this category.
          </p>
          <a
            href={`/admin/menu/categories/${category.id}/pages`}
            className="admin-btn-save"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Manage Pages
          </a>
        </AdminFormBlock>
      )}

      <EditorActions
        saving={saving}
        isCreateMode={isNew}
        entityName="Category"
        onCancel={() => router.push(backHref)}
        onDelete={!isNew && category ? handleDelete : undefined}
        deleting={deleting}
      />
    </form>
  );
}
