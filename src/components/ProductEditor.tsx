"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductItem, ProductCategory } from "@/lib/api";

type ProductEditorProps = {
  product: ProductItem;
  categories?: ProductCategory[];
};

export default function ProductEditor({
  product,
  categories = [],
}: ProductEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title || "");
  const [slug, setSlug] = useState(product.slug || "");
  const [problem, setProblem] = useState(product.problem || "");
  const [description, setDescription] = useState(product.description || "");
  const [bullets, setBullets] = useState(
    (product.bullets || []).join("\n") || "",
  );
  const [image, setImage] = useState(product.image || "");
  const [etsyUrl, setEtsyUrl] = useState(product.etsyUrl || "");
  const [productPageUrl, setProductPageUrl] = useState(
    product.productPageUrl || "",
  );
  const [price, setPrice] = useState(product.price || "");
  const [categoryId, setCategoryId] = useState(product.categoryId || "");
  const [status, setStatus] = useState<"draft" | "published">(
    product.status || "draft",
  );
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
        productPageUrl: productPageUrl || undefined,
        price: price || undefined,
        categoryId,
        status,
      };

      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setError(`Error: ${err}`);
      } else {
        setMessage("Product saved successfully!");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setError(`Error: ${err}`);
        setDeleting(false);
      } else {
        setMessage("Product deleted!");
        // Redirect to products list
        router.push("/admin/products");
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
          <label className="form-label">Title *</label>
          <input
            className="form-control"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        {categories.length > 0 && (
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
        )}

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
          {deleting ? "Deleting..." : "Delete Product"}
        </button>
      </div>
    </form>
  );
}
