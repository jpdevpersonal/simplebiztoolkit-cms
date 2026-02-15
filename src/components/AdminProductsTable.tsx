"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductItem, ProductCategory } from "@/lib/api";

type Props = {
  products: ProductItem[];
  categories: ProductCategory[];
};

export default function AdminProductsTable({ products, categories }: Props) {
  const [sortBy, setSortBy] = useState<"title" | "status">("title");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  // Local state so we can refresh client-side using credentials (includes cookies)
  const [localCategories, setLocalCategories] =
    useState<ProductCategory[]>(categories);
  const [localProducts, setLocalProducts] = useState<ProductItem[]>(products);

  useEffect(() => {
    // Try to fetch categories client-side with credentials to include NextAuth cookie.
    // This ensures draft products are returned when the user is signed in in the browser.
    let mounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch("/api/products/allCategories", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!data) return;
        // Unwrap envelope if present
        const payload = data.data ?? data;
        if (!mounted) return;
        const payloadArray = (payload as ProductCategory[]) || [];
        setLocalCategories(payloadArray);
        setLocalProducts(payloadArray.flatMap((c) => c.items || []));
      } catch {
        // ignore
      }
    }

    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  const sorted = useMemo(() => {
    const copy = [...localProducts];
    copy.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortBy === "title") {
        va = a.title.toLowerCase();
        vb = b.title.toLowerCase();
      } else if (sortBy === "status") {
        va = a.status;
        vb = b.status;
      }

      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [localProducts, sortBy, dir]);

  function toggleSort(column: "title" | "status") {
    if (sortBy === column) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setDir("asc");
    }
  }

  return (
    <div className="sb-card">
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th role="button" onClick={() => toggleSort("title")}>
                Title{sortBy === "title" ? (dir === "asc" ? " ▲" : " ▼") : ""}
              </th>
              <th>Category</th>
              <th>Price</th>
              <th role="button" onClick={() => toggleSort("status")}>
                Status{sortBy === "status" ? (dir === "asc" ? " ▲" : " ▼") : ""}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 sb-muted">
                  No products found. Create your first product!
                </td>
              </tr>
            )}
            {sorted.map((product) => {
              const category = localCategories.find(
                (cat) => cat.id === product.categoryId,
              );
              return (
                <tr key={product.id}>
                  <td style={{ fontWeight: 600 }}>{product.title}</td>
                  <td>{category?.name}</td>
                  <td>{product.price}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: "transparent",
                        color:
                          product.status === "published"
                            ? "var(--sb-success)"
                            : "#6c757d",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "0.25rem",
                        border: "1px solid transparent",
                      }}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="btn btn-sm sb-btn-ghost"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
