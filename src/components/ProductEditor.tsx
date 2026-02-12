"use client";

import React, { useState } from "react";

type Product = {
  id: string;
  title: string;
  price: string;
  status: "draft" | "published";
  categoryId: string;
};

export default function ProductEditor({ product }: { product: Product }) {
  const [title, setTitle] = useState(product.title || "");
  const [price, setPrice] = useState(product.price || "");
  const [status, setStatus] = useState<Product["status"]>(
    product.status || "draft",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, price, status }),
      });

      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        setMessage(`Error: ${err}`);
      } else {
        setMessage("Saved");
      }
    } catch (err: any) {
      setMessage(err?.message || "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="sb-card p-3">
      <div className="mb-3">
        <label className="form-label">Title</label>
        <input
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Price</label>
        <input
          className="form-control"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Status</label>
        <select
          className="form-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="draft">draft</option>
          <option value="published">published</option>
        </select>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      <button type="submit" className="btn sb-btn-primary" disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
