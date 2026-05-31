"use client";

import React, { useEffect, useState } from "react";
import ProductEditor from "@/components/ProductEditor";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";

type Props = { id: string };

export default function ProductEditorLoader({ id }: Props) {
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [productPayload, categoryPayload] = await Promise.all([
          clientApi.getProductById(id),
          clientApi.getProductCategories(),
        ]);
        if (!mounted) return;
        setProduct(productPayload || null);
        setCategories(categoryPayload || []);
      } catch (err) {
        if (!mounted) return;
        setProduct(null);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load template. Please try again.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id, reloadKey]);

  if (loading) return <div className="sb-card p-3">Loading template…</div>;

  if (error) {
    return (
      <div className="sb-card p-3" role="alert">
        <div className="admin-feedback admin-feedback-error">{error}</div>
        <button
          type="button"
          className="admin-btn-action"
          onClick={() => setReloadKey((key) => key + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!product) return <div className="sb-card p-3">Template not found.</div>;

  return <ProductEditor product={product} categories={categories} />;
}
