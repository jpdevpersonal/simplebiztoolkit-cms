"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/api";
import AdminSortIcon from "@/components/AdminSortIcon";
import { compareSortValues } from "@/lib/sortUtils";

type Props = {
  articles: Article[];
};

type SortCol = "title" | "slug" | "category" | "status" | "dateISO";

export default function AdminArticlesTable({ articles }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("title");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const copy = [...articles];
    copy.sort((a, b) => {
      const va: string | number =
        sortBy === "title"
          ? a.title.toLowerCase()
          : sortBy === "slug"
            ? a.slug.toLowerCase()
            : sortBy === "category"
              ? (a.category ?? "").toLowerCase()
              : sortBy === "status"
                ? (a.status ?? "")
                : (a.dateISO ?? "");

      const vb: string | number =
        sortBy === "title"
          ? b.title.toLowerCase()
          : sortBy === "slug"
            ? b.slug.toLowerCase()
            : sortBy === "category"
              ? (b.category ?? "").toLowerCase()
              : sortBy === "status"
                ? (b.status ?? "")
                : (b.dateISO ?? "");

      return compareSortValues(va, vb, dir);
    });
    return copy;
  }, [articles, sortBy, dir]);

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
              className={"sortable" + (sortBy === "slug" ? " sort-active" : "")}
              onClick={() => toggleSort("slug")}
            >
              Slug
              <AdminSortIcon active={sortBy === "slug"} dir={dir} />
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
                "sortable" + (sortBy === "status" ? " sort-active" : "")
              }
              onClick={() => toggleSort("status")}
            >
              Status
              <AdminSortIcon active={sortBy === "status"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "dateISO" ? " sort-active" : "")
              }
              onClick={() => toggleSort("dateISO")}
            >
              Published
              <AdminSortIcon active={sortBy === "dateISO"} dir={dir} />
            </th>
            <th>Preview</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className="admin-empty-state">
                No articles found. Create your first article!
              </td>
            </tr>
          )}
          {sorted.map((article) => (
            <tr key={article.id}>
              <td className="admin-cell-strong admin-cell-max-280">
                {article.title}
              </td>
              <td className="admin-cell-muted admin-cell-max-180 admin-cell-ellipsis">
                {article.slug}
              </td>
              <td className="admin-cell-muted">{article.category}</td>
              <td>
                <span
                  className={
                    "admin-badge " +
                    (article.status === "published"
                      ? "admin-badge-published"
                      : "admin-badge-draft")
                  }
                >
                  {article.status}
                </span>
              </td>
              <td className="admin-cell-muted-sm admin-cell-nowrap">
                {article.dateISO ?? "—"}
              </td>
              <td>
                <Link
                  href={`/blog/${article.slug}`}
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
              </td>
              <td>
                <Link
                  href={`/admin/articles/${article.id}/edit`}
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
