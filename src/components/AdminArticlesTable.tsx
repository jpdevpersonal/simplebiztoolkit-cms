"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Article } from "@/lib/api";

type Props = {
  articles: Article[];
};

type SortCol = "title" | "slug" | "category" | "status" | "dateISO";

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

export default function AdminArticlesTable({ articles }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("title");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const copy = [...articles];
    copy.sort((a, b) => {
      let va: string | number = "";
      let vb: string | number = "";
      if (sortBy === "title") {
        va = a.title.toLowerCase();
        vb = b.title.toLowerCase();
      } else if (sortBy === "slug") {
        va = a.slug.toLowerCase();
        vb = b.slug.toLowerCase();
      } else if (sortBy === "category") {
        va = (a.category ?? "").toLowerCase();
        vb = (b.category ?? "").toLowerCase();
      } else if (sortBy === "status") {
        va = a.status ?? "";
        vb = b.status ?? "";
      } else if (sortBy === "dateISO") {
        va = a.dateISO ?? "";
        vb = b.dateISO ?? "";
      }
      if (va < vb) return dir === "asc" ? -1 : 1;
      if (va > vb) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [articles, sortBy, dir]);

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
            <th
              className={"sortable" + (sortBy === "slug" ? " sort-active" : "")}
              onClick={() => toggleSort("slug")}
            >
              Slug
              <SortIcon active={sortBy === "slug"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "category" ? " sort-active" : "")
              }
              onClick={() => toggleSort("category")}
            >
              Category
              <SortIcon active={sortBy === "category"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "status" ? " sort-active" : "")
              }
              onClick={() => toggleSort("status")}
            >
              Status
              <SortIcon active={sortBy === "status"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "dateISO" ? " sort-active" : "")
              }
              onClick={() => toggleSort("dateISO")}
            >
              Published
              <SortIcon active={sortBy === "dateISO"} dir={dir} />
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
              <td style={{ fontWeight: 600, maxWidth: "280px" }}>
                {article.title}
              </td>
              <td
                style={{
                  color: "var(--sb-muted)",
                  fontSize: "0.875rem",
                  maxWidth: "180px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {article.slug}
              </td>
              <td style={{ color: "var(--sb-muted)", fontSize: "0.875rem" }}>
                {article.category}
              </td>
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
              <td
                style={{
                  color: "var(--sb-muted)",
                  fontSize: "0.8125rem",
                  whiteSpace: "nowrap",
                }}
              >
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
