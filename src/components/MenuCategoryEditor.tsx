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
  const [status, setStatus] = useState<"draft" | "published">(
    category?.status ?? "draft",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backHref = `/admin/menu/${menuItemId}/edit`;

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
        status,
      };

      if (isNew) {
        const created = await clientApi.createMenuCategory(payload);
        router.push(
          `/admin/menu/categories/${(created as MenuCategory).id}/edit`,
        );
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

      <AdminFormBlock icon={publishIcon} title="Publish">
        <div className="mb-0">
          <label className="form-label fw-semibold">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </AdminFormBlock>

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
