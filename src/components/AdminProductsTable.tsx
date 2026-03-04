"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import AdminSortIcon from "@/components/AdminSortIcon";
import { compareSortValues, parseCurrencyValue } from "@/lib/sortUtils";

type Props = {
  products: ProductItem[];
  categories: ProductCategory[];
};

type SortCol = "title" | "status" | "category" | "price";

export default function AdminProductsTable({ products, categories }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("category");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const [localCategories, setLocalCategories] =
    useState<ProductCategory[]>(categories);
  const [localProducts, setLocalProducts] = useState<ProductItem[]>(products);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  useEffect(() => {
    if (categories.length > 0 || products.length > 0) {
      return;
    }

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
  }, [categories.length, products.length]);

  const categoryNameMap = useMemo(
    () => Object.fromEntries(localCategories.map((c) => [c.id, c.name])),
    [localCategories],
  );

  const sorted = useMemo(() => {
    const copy = [...localProducts];
    copy.sort((a, b) => {
      const va: string | number =
        sortBy === "title"
          ? a.title.toLowerCase()
          : sortBy === "status"
            ? (a.status ?? "")
            : sortBy === "category"
              ? (categoryNameMap[a.categoryId] ?? "").toLowerCase()
              : parseCurrencyValue(a.price);

      const vb: string | number =
        sortBy === "title"
          ? b.title.toLowerCase()
          : sortBy === "status"
            ? (b.status ?? "")
            : sortBy === "category"
              ? (categoryNameMap[b.categoryId] ?? "").toLowerCase()
              : parseCurrencyValue(b.price);

      return compareSortValues(va, vb, dir);
    });
    return copy;
  }, [localProducts, sortBy, dir, categoryNameMap]);

  const toggleSort = useCallback(
    (column: SortCol) => {
      if (sortBy === column) {
        setDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(column);
        setDir("asc");
      }
    },
    [sortBy],
  );

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
              <AdminSortIcon active={sortBy === "title"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "category" ? " sort-active" : "")
              }
              onClick={() => toggleSort("category")}
            >
              Category
              <AdminSortIcon active={sortBy === "category"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "price" ? " sort-active" : "")
              }
              onClick={() => toggleSort("price")}
            >
              Price
              <AdminSortIcon active={sortBy === "price"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "status" ? " sort-active" : "")
              }
              onClick={() => toggleSort("status")}
            >
              Status
              <AdminSortIcon active={sortBy === "status"} dir={dir} />
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
            const categoryName = categoryNameMap[product.categoryId] ?? "—";
            return (
              <tr key={product.id}>
                <td className="admin-cell-strong">{product.title}</td>
                <td className="admin-cell-muted">{categoryName}</td>
                <td className="admin-cell-muted">{product.price ?? "—"}</td>
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
                        className="admin-inline-icon"
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
                    <span className="admin-cell-muted-sm">—</span>
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
