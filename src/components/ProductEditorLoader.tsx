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

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [productPayload, categoryPayload] = await Promise.all([
          clientApi.getProductById(id),
          clientApi.getProductCategories(),
        ]);
        if (!mounted) return;
        setProduct(productPayload || null);
        setCategories(categoryPayload || []);
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
