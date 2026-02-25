"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { MenuItem } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import AdminFormBlock from "@/components/AdminFormBlock";
import EditorActions from "@/components/EditorActions";
import EditorFeedback from "@/components/EditorFeedback";

type Props = {
  menuItem?: MenuItem;
  isNew?: boolean;
};

export default function MenuItemEditor({ menuItem, isNew = false }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(menuItem?.title ?? "");
  const [description, setDescription] = useState(menuItem?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const payload = { title, description: description || undefined };

      if (isNew) {
        await clientApi.createMenuItem(payload);
        router.push("/admin/menu");
        router.refresh();
      } else if (menuItem?.id) {
        await clientApi.updateMenuItem(menuItem.id, payload);
        setMessage("Menu item saved successfully!");
        router.refresh();
      } else {
        throw new Error("Missing menu item id for update");
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
        "Are you sure you want to delete this menu item? All categories and pages beneath it will also be deleted.",
      )
    )
      return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteMenuItem(menuItem!.id);
      router.push("/admin/menu");
      router.refresh();
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
              placeholder="e.g. Products, Resources"
              required
            />
            <div className="form-text">
              This label appears in the site navigation bar.
            </div>
          </div>

          <div className="col-12">
            <label className="form-label fw-semibold">Description</label>
            <textarea
              className="form-control"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description for this navigation item"
            />
          </div>
        </div>
      </AdminFormBlock>

      {!isNew && menuItem && (
        <AdminFormBlock
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 7h18M3 12h18M3 17h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          }
          title="Categories"
        >
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--sb-muted)",
              marginBottom: "0.75rem",
            }}
          >
            Manage the categories that appear under this menu item.
          </p>
          <a
            href={`/admin/menu/${menuItem.id}/categories`}
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
                d="M3 7h18M3 12h18M3 17h12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Manage Categories
          </a>
        </AdminFormBlock>
      )}

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
