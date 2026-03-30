"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/api";
import { redirectAndRefresh, refreshEditor } from "@/lib/adminNavigation";
import { clientApi } from "@/lib/clientApi";
import { revalidateMenuContent } from "@/lib/adminRevalidation";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";
import RichContentField from "@/components/RichContentField";

type Props = {
  menuItem?: MenuItem;
  isNew?: boolean;
};

export default function MenuItemEditor({ menuItem, isNew = false }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(menuItem?.title ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");
  const [status, setStatus] = useState<"draft" | "published">(
    menuItem?.status ?? "draft",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveMenuItem() {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = { title, description: description || undefined, status };

      if (isNew) {
        const created = await clientApi.createMenuItem(payload);
        await revalidateMenuContent();
        redirectAndRefresh(
          router,
          `/admin/menu/${(created as MenuItem).id}/edit`,
        );
      } else if (menuItem?.id) {
        await clientApi.updateMenuItem(menuItem.id, payload);
        await revalidateMenuContent();
        setMessage("Menu item saved successfully!");
        refreshEditor(router);
      } else {
        throw new Error("Missing menu item id for update");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await saveMenuItem();
  }

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete this menu item? All categories and pages beneath it will also be deleted.",
      )
    )
      return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuItem(menuItem!.id);
      await revalidateMenuContent();
      redirectAndRefresh(router, "/admin/menu");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  const detailsIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 12h18M3 6h18M3 18h12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

      <AdminFormBlock icon={detailsIcon} title="Menu Item Details">
        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-semibold">Title *</label>
            <input
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Products, Guides"
              required
            />
            <div className="form-text">
              This label appears in the site navigation bar when published with
              at least one page.
            </div>
          </div>

          <div className="col-12">
            <RichContentField
              label="Description"
              value={description}
              onChange={setDescription}
              storageKey="menu-item-description-mode"
              htmlRows={3}
              placeholder="Optional description for this navigation item"
              onSave={saveMenuItem}
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
          <div className="form-text">
            Set to <strong>Published</strong> so this item appears in the site
            navigation (requires at least one published page).
          </div>
        </div>
      </AdminFormBlock>

      <EditorActions
        saving={saving}
        isCreateMode={isNew}
        entityName="Menu Item"
        onCancel={() => router.push("/admin/menu")}
        onDelete={!isNew && menuItem ? handleDelete : undefined}
        deleting={deleting}
      />
    </form>
  );
}
