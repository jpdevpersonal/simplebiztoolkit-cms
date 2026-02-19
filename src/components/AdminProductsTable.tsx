"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";

type Props = {
  products: ProductItem[];
  categories: ProductCategory[];
};

type SortCol = "title" | "status";

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <span
      style={{
        marginLeft: "0.375rem",
        opacity: active ? 1 : 0.3,
        fontSize: "0.7rem",
      }}
      aria-hidden="true"
    >
      {active && dir === "desc" ? "▼" : "▲"}
    </span>
  );
}

export default function AdminProductsTable({ products, categories }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("title");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const [localCategories, setLocalCategories] =
    useState<ProductCategory[]>(categories);
  const [localProducts, setLocalProducts] = useState<ProductItem[]>(products);

  useEffect(() => {
    let mounted = true;
    async function fetchCategories() {
      try {
        const payload = await clientApi.getAllProductCategories();
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
      const va = sortBy === "title" ? a.title.toLowerCase() : (a.status ?? "");
      const vb = sortBy === "title" ? b.title.toLowerCase() : (b.status ?? "");
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [localProducts, sortBy, dir]);

  function toggleSort(column: SortCol) {
    if (sortBy === column) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setDir("asc");
    }
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th
              className={
                "sortable" + (sortBy === "title" ? " sort-active" : "")
              }
              onClick={() => toggleSort("title")}
            >
              Title
              <SortIcon active={sortBy === "title"} dir={dir} />
            </th>
            <th>Category</th>
            <th>Price</th>
            <th
              className={
                "sortable" + (sortBy === "status" ? " sort-active" : "")
              }
              onClick={() => toggleSort("status")}
            >
              Status
              <SortIcon active={sortBy === "status"} dir={dir} />
            </th>
            <th>Preview</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="admin-empty-state">
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
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {category?.name ?? "—"}
                </td>
                <td style={{ color: "var(--sb-muted)", fontSize: "0.9rem" }}>
                  {product.price ?? "—"}
                </td>
                <td>
                  <span
                    className={
                      "admin-badge " +
                      (product.status === "published"
                        ? "admin-badge-published"
                        : "admin-badge-draft")
                    }
                  >
                    {product.status}
                  </span>
                </td>
                <td>
                  {product.productPageUrl ? (
                    <Link
                      href={product.productPageUrl}
                      className="admin-btn-action"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        style={{ marginLeft: "0.25rem" }}
                      >
                        <path
                          d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points="15 3 21 3 21 9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <line
                          x1="10"
                          y1="14"
                          x2="21"
                          y2="3"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </Link>
                  ) : (
                    <span
                      style={{ color: "var(--sb-muted)", fontSize: "0.8rem" }}
                    >
                      —
                    </span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="admin-btn-action"
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
  );
}
