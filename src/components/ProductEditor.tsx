"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import RichContentField from "@/components/RichContentField";

type ProductEditorProps = {
  product?: ProductItem;
  categories?: ProductCategory[];
};

const EMPTY_PRODUCT: ProductItem = {
  id: "",
  title: "",
  slug: "",
  problem: "",
  description: "",
  bullets: [],
  image: "",
  etsyUrl: "",
  productPageUrl: "",
  price: "",
  categoryId: "",
  status: "draft",
};

export default function ProductEditor({
  product,
  categories = [],
}: ProductEditorProps) {
  const productData = product || EMPTY_PRODUCT;
  const isCreateMode = !productData.id;
  const router = useRouter();
  const [title, setTitle] = useState(productData.title || "");
  const [slug, setSlug] = useState(productData.slug || "");
  const [problem, setProblem] = useState(productData.problem || "");
  const [description, setDescription] = useState(productData.description || "");
  const [bullets, setBullets] = useState(
    (productData.bullets || []).join("\n") || "",
  );
  const [image, setImage] = useState(productData.image || "");
  const [etsyUrl, setEtsyUrl] = useState(productData.etsyUrl || "");
  const [productPageUrl, setProductPageUrl] = useState(
    productData.productPageUrl || "",
  );
  const [price, setPrice] = useState(productData.price || "");
  const [categoryId, setCategoryId] = useState(productData.categoryId || "");
  const [status, setStatus] = useState<"draft" | "published">(
    productData.status || "draft",
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isCreateMode && !categoryId && categories.length > 0) {
      setCategoryId(categories[0].id);
    }
  }, [isCreateMode, categoryId, categories]);

  const handleTitleChange = (value: string) => {
    setTitle(value);

    if (isCreateMode && !slug.trim()) {
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
    setMessage(null);
    setError(null);

    try {
      // Parse bullets from newline-separated text
      const bulletsArray = bullets
        .split("\n")
        .map((b) => b.trim())
        .filter((b) => b);

      const payload = {
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

      const saved = isCreateMode
        ? await clientApi.createProduct(payload)
        : await clientApi.updateProduct(productData.id, payload);

      if (isCreateMode) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setMessage("Product saved successfully!");

        // Update local state from response (if backend returns the saved product)
        if (saved && typeof saved === "object") {
          // Merge returned fields into local state where present
          setTitle((saved.title as string) || title);
          setSlug((saved.slug as string) || slug);
          setProblem((saved.problem as string) || problem);
          setDescription((saved.description as string) || description);
          setBullets(((saved.bullets as string[]) || []).join("\n") || bullets);
          setImage((saved.image as string) || image);
          setEtsyUrl((saved.etsyUrl as string) || etsyUrl);
          setProductPageUrl((saved.productPageUrl as string) || productPageUrl);
          setPrice((saved.price as string) || price);
          setCategoryId((saved.categoryId as string) || categoryId);
          setStatus((saved.status as "draft" | "published") || status);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (isCreateMode) {
      return;
    }

    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeleting(true);
    setMessage(null);
    setError(null);

    try {
      await clientApi.deleteProduct(productData.id);
      setMessage("Product deleted!");
      // Redirect to products list
      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic product info */}
      <div className="admin-form-block">
        <div className="admin-form-block-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1="3"
              y1="6"
              x2="21"
              y2="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M16 10a4 4 0 0 1-8 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="admin-form-block-title">Product Details</span>
        </div>
        <div className="admin-form-block-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Title *</label>
              <input
                className="form-control"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Slug *</label>
              <input
                className="form-control"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </div>

            {categories.length > 0 && (
              <div className="col-md-6">
                <label className="form-label fw-semibold">Category *</label>
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

            <div className="col-md-3">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label fw-semibold">Price</label>
              <input
                className="form-control"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="$9.99"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content & media */}
      <div className="admin-form-block">
        <div className="admin-form-block-header">
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
          <span className="admin-form-block-title">Content &amp; Media</span>
        </div>
        <div className="admin-form-block-body">
          <div className="row g-3">
            <div className="col-12">
              <RichContentField
                label="Problem Statement"
                value={problem}
                onChange={setProblem}
                storageKey="product-problem-editor-mode"
                htmlRows={3}
                minHeight={150}
                placeholder="Describe the problem this product solves…"
              />
            </div>

            <div className="col-12">
              <RichContentField
                label="Description"
                value={description}
                onChange={setDescription}
                storageKey="product-description-editor-mode"
                htmlRows={4}
                minHeight={200}
                placeholder="Describe the product in detail…"
              />
            </div>

            <div className="col-12">
              <label className="form-label fw-semibold">
                Bullets{" "}
                <span style={{ fontWeight: 400, color: "var(--sb-muted)" }}>
                  (one per line)
                </span>
              </label>
              <textarea
                className="form-control"
                value={bullets}
                onChange={(e) => setBullets(e.target.value)}
                rows={5}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Image URL</label>
              <input
                className="form-control"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="/images/..."
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Etsy URL</label>
              <input
                className="form-control"
                value={etsyUrl}
                onChange={(e) => setEtsyUrl(e.target.value)}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Product Page URL</label>
              <input
                className="form-control"
                value={productPageUrl}
                onChange={(e) => setProductPageUrl(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {message && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "8px",
            color: "#166534",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          {message}
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            background: "#fff5f5",
            border: "1px solid #fca5a5",
            borderRadius: "8px",
            color: "#dc2626",
            fontSize: "0.875rem",
            fontWeight: 500,
            marginBottom: "0.75rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="admin-form-actions">
        <div className="admin-form-actions-primary">
          <button type="submit" className="admin-btn-save" disabled={saving}>
            {saving
              ? isCreateMode
                ? "Creating..."
                : "Saving..."
              : isCreateMode
                ? "Create Product"
                : "Save Changes"}
          </button>
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
        {!isCreateMode && (
          <button
            type="button"
            className="admin-btn-danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Product"}
          </button>
        )}
      </div>
    </form>
  );
}
