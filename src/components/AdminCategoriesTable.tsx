"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { ProductCategory } from "@/lib/api";
import AdminTableToolbar from "@/components/AdminTableToolbar";

type Props = {
  categories: ProductCategory[];
};

export default function AdminCategoriesTable({ categories }: Props) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return categories;

    return categories.filter((category) =>
      `${category.name} ${category.slug}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [categories, deferredQuery]);

  return (
    <div className="admin-table-wrap">
      <AdminTableToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search template categories"
        placeholder="Search name or slug"
        visibleCount={filtered.length}
        totalCount={categories.length}
        onClear={() => setQuery("")}
      />
      <table className="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Slug</th>
            <th>Templates</th>
            <th>Preview</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} className="admin-empty-state">
                {categories.length === 0
                  ? "No categories found. Create your first category!"
                  : "No categories match your search."}
              </td>
            </tr>
          ) : null}
          {filtered.map((category) => (
            <tr key={category.id}>
              <td className="admin-cell-strong" data-label="Name">
                {category.name}
              </td>
              <td
                className="admin-cell-code admin-cell-max-180 admin-cell-ellipsis"
                data-label="Slug"
              >
                {category.slug}
              </td>
              <td className="admin-cell-muted" data-label="Templates">
                {category.items?.length || 0}
              </td>
              <td className="admin-cell-actions" data-label="Preview">
                <Link
                  href={`/templates/${category.slug}`}
                  className="admin-btn-action"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                  <ExternalLink
                    size={12}
                    className="admin-inline-icon"
                    aria-hidden="true"
                  />
                </Link>
              </td>
              <td className="admin-cell-actions" data-label="Actions">
                <Link
                  href={`/cms/categories/${category.id}/edit`}
                  className="admin-btn-action"
                >
                  Edit
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
