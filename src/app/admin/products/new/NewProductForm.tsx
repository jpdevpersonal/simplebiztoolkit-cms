"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductCategory } from "@/lib/api";

type NewProductFormProps = {
  categories: ProductCategory[];
};

export default function NewProductForm({ categories }: NewProductFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [problem, setProblem] = useState("");
  const [description, setDescription] = useState("");
  const [bullets, setBullets] = useState("");
  const [image, setImage] = useState("");
  const [etsyUrl, setEtsyUrl] = useState("");
  const [price, setPrice] = useState("");
  const [productPageUrl, setProductPageUrl] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(autoSlug);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Parse bullets from newline-separated text
      const bulletsArray = bullets
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b);

      const productData = {
        title,
        slug,
        problem: problem || undefined,
        description: description || undefined,
        bullets: bulletsArray,
        image: image || undefined,
        etsyUrl: etsyUrl || undefined,
        price: price || undefined,
        productPageUrl: productPageUrl || undefined,
        categoryId,
        status,
      };

      const res = await fetch("/api/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setError(`Error: ${err}`);
        setSaving(false);
        return;
      }

      // Redirect to products list on success
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sb-card p-3">
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Title *</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
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

        <div className="col-md-6">
          <label className="form-label">Category *</label>
          <select
            className="form-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Price</label>
          <input
            className="form-control"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="$9.99"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Image URL</label>
          <input
            className="form-control"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Problem Statement</label>
          <textarea
            className="form-control"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={3}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="col-12">
          <label className="form-label">Bullets (one per line)</label>
          <textarea
            className="form-control"
            value={bullets}
            onChange={(e) => setBullets(e.target.value)}
            rows={5}
            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Etsy URL</label>
          <input
            className="form-control"
            value={etsyUrl}
            onChange={(e) => setEtsyUrl(e.target.value)}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Product Page URL</label>
          <input
            className="form-control"
            value={productPageUrl}
            onChange={(e) => setProductPageUrl(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="alert alert-danger mt-3">{error}</div>}

      <div className="mt-4 d-flex gap-2">
        <button type="submit" className="btn sb-btn-primary" disabled={saving}>
          {saving ? "Creating..." : "Create Product"}
        </button>
        <button
          type="button"
          className="btn sb-btn-ghost"
          onClick={() => router.back()}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
