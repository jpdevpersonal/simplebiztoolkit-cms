"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@/lib/api";

type Props = {
  category: ProductCategory;
};

export default function CategoryEditor({ category }: Props) {
  const router = useRouter();
  const [name, setName] = useState(category.name || "");
  const [slug, setSlug] = useState(category.slug || "");
  const [summary, setSummary] = useState(category.summary || "");
  const [howThisHelps, setHowThisHelps] = useState(category.howThisHelps || "");
  const [heroImage, setHeroImage] = useState(category.heroImage || "");
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
      const payload = {
        name,
        slug,
        summary,
        howThisHelps,
        heroImage,
      };

      const res = await fetch(`/api/products/categories/${category.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setError(`Error: ${err}`);
      } else {
        setMessage("Category saved successfully!");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this category?")) return;
    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/products/categories/${category.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setError(`Error: ${err}`);
        setDeleting(false);
      } else {
        setMessage("Category deleted");
        router.push("/admin/categories");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sb-card p-3">
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Name *</label>
          <input
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Slug *</label>
          <input
            className="form-control"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </div>

        <div className="col-12">
          <label className="form-label">Summary</label>
          <textarea
            className="form-control"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
        </div>

        <div className="col-12">
          <label className="form-label">How this helps</label>
          <textarea
            className="form-control"
            value={howThisHelps}
            onChange={(e) => setHowThisHelps(e.target.value)}
            rows={4}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Hero Image URL</label>
          <input
            className="form-control"
            value={heroImage}
            onChange={(e) => setHeroImage(e.target.value)}
          />
        </div>
      </div>

      {message && <div className="alert alert-success mt-3">{message}</div>}
      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="mt-4 d-flex gap-2 justify-content-between">
        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn sb-btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn sb-btn-ghost"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete Category"}
        </button>
      </div>
    </form>
  );
}
