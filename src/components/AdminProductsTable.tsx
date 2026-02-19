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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-empty-state">
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
