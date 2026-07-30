"use client";

import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import type { ProductItem, ProductCategory } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import AdminSortIcon from "@/components/AdminSortIcon";
import AdminTableToolbar from "@/components/AdminTableToolbar";
import { compareSortValues, parseCurrencyValue } from "@/lib/sortUtils";
import { toTemplatesRoute } from "@/lib/templatesRoute";

type Props = {
  products: ProductItem[];
  categories: ProductCategory[];
};

type SortCol = "title" | "status" | "category" | "price";

export default function AdminProductsTable({ products, categories }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("category");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const deferredQuery = useDeferredValue(query);

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

  const categoryOptions = useMemo(
    () =>
      [...localCategories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((category) => ({
          label: category.name,
          value: category.id,
        })),
    [localCategories],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return localProducts.filter((product) => {
      const categoryName = categoryNameMap[product.categoryId] ?? "";
      const matchesQuery =
        !normalizedQuery ||
        `${product.title} ${categoryName}`
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesQuery &&
        (!statusFilter || product.status === statusFilter) &&
        (!categoryFilter || product.categoryId === categoryFilter)
      );
    });
  }, [
    categoryFilter,
    categoryNameMap,
    deferredQuery,
    localProducts,
    statusFilter,
  ]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
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
  }, [filtered, sortBy, dir, categoryNameMap]);

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

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "category") setCategoryFilter(value);
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setCategoryFilter("");
  };

  return (
    <div className="admin-table-wrap">
      <AdminTableToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search templates"
        placeholder="Search title or category"
        filters={[
          {
            key: "status",
            label: "Status",
            value: statusFilter,
            options: [
              { label: "Published", value: "published" },
              { label: "Draft", value: "draft" },
            ],
          },
          {
            key: "category",
            label: "Category",
            value: categoryFilter,
            options: categoryOptions,
          },
        ]}
        onFilterChange={handleFilterChange}
        visibleCount={sorted.length}
        totalCount={localProducts.length}
        onClear={clearFilters}
      />
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
                {localProducts.length === 0
                  ? "No templates found. Create your first template!"
                  : "No templates match the current search and filters."}
              </td>
            </tr>
          )}
          {sorted.map((product) => {
            const categoryName = categoryNameMap[product.categoryId] ?? "—";
            const productPageUrl = toTemplatesRoute(product.productPageUrl);
            return (
              <tr key={product.id}>
                <td className="admin-cell-strong" data-label="Title">
                  {product.title}
                </td>
                <td className="admin-cell-muted" data-label="Category">
                  {categoryName}
                </td>
                <td
                  className="admin-cell-muted admin-cell-nowrap"
                  data-label="Price"
                >
                  {product.price ?? "—"}
                </td>
                <td data-label="Status">
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
                <td className="admin-cell-actions" data-label="Preview">
                  {productPageUrl ? (
                    <Link
                      href={productPageUrl}
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
                <td className="admin-cell-actions" data-label="Actions">
                  <Link
                    href={`/cms/templates/${product.id}/edit`}
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
