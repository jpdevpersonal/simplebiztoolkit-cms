"use client";

import React, { useEffect, useState } from "react";
import ProductEditor from "@/components/ProductEditor";
import type { ProductItem, ProductCategory } from "@/lib/api";

type Props = { id: string };

export default function ProductEditorLoader({ id }: Props) {
  const [product, setProduct] = useState<ProductItem | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [pRes, cRes] = await Promise.all([
          fetch(`/api/products/${id}`, { credentials: "include" }),
          fetch(`/api/products/categories`, { credentials: "include" }),
        ]);
        if (!mounted) return;
        if (pRes.ok) {
          const pJson = await pRes.json().catch(() => null);
          const pPayload = pJson?.data ?? pJson;
          setProduct(pPayload || null);
        }
        if (cRes.ok) {
          const cJson = await cRes.json().catch(() => null);
          const cPayload = cJson?.data ?? cJson;
          setCategories(cPayload || []);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!product) return <div className="sb-card p-3">Product not found.</div>;

  return <ProductEditor product={product} categories={categories} />;
}
