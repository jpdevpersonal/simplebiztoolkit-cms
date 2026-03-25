"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import AdminSortIcon from "@/components/AdminSortIcon";
import { compareSortValues } from "@/lib/sortUtils";

export type AdminPageRow = {
  id: string;
  title: string;
  slug: string;
  menuItemTitle: string;
  categoryTitle: string | null;
  status?: string;
  dateISO?: string;
};

type Props = {
  pages: AdminPageRow[];
};

type SortCol =
  | "title"
  | "slug"
  | "menuItemTitle"
  | "categoryTitle"
  | "status"
  | "dateISO";

function StatusBadge({ status }: { status?: string }) {
  const published = status === "published";
  return (
    <span
      className={`admin-badge ${published ? "admin-badge-published" : "admin-badge-draft"}`}
    >
      {status ?? "draft"}
    </span>
  );
}

export default function AdminPagesTable({ pages }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("title");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const copy = [...pages];
    copy.sort((a, b) => {
      const va: string | number =
        sortBy === "title"
          ? a.title.toLowerCase()
          : sortBy === "slug"
            ? a.slug.toLowerCase()
            : sortBy === "menuItemTitle"
              ? (a.menuItemTitle ?? "").toLowerCase()
              : sortBy === "categoryTitle"
                ? (a.categoryTitle ?? "").toLowerCase()
                : sortBy === "status"
                  ? (a.status ?? "")
                  : (a.dateISO ?? "");

      const vb: string | number =
        sortBy === "title"
          ? b.title.toLowerCase()
          : sortBy === "slug"
            ? b.slug.toLowerCase()
            : sortBy === "menuItemTitle"
              ? (b.menuItemTitle ?? "").toLowerCase()
              : sortBy === "categoryTitle"
                ? (b.categoryTitle ?? "").toLowerCase()
                : sortBy === "status"
                  ? (b.status ?? "")
                  : (b.dateISO ?? "");

      return compareSortValues(va, vb, dir);
    });
    return copy;
  }, [pages, sortBy, dir]);

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
                "sortable" + (sortBy === "menuItemTitle" ? " sort-active" : "")
              }
              onClick={() => toggleSort("menuItemTitle")}
            >
              Menu Item
              <AdminSortIcon active={sortBy === "menuItemTitle"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "categoryTitle" ? " sort-active" : "")
              }
              onClick={() => toggleSort("categoryTitle")}
            >
              Topic
              <AdminSortIcon active={sortBy === "categoryTitle"} dir={dir} />
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
              <td colSpan={8} className="admin-empty-state">
                No pages found. Create your first page!
              </td>
            </tr>
          )}
          {sorted.map((page) => (
            <tr key={page.id}>
              <td
                className="admin-cell-strong admin-cell-max-280"
                data-label="Title"
              >
                {page.title}
              </td>
              <td
                className="admin-cell-code admin-cell-max-180 admin-cell-ellipsis admin-col-tablet-hide admin-col-phone-hide"
                data-label="Slug"
              >
                {page.slug}
              </td>
              <td className="admin-cell-muted" data-label="Menu Item">
                {page.menuItemTitle}
              </td>
              <td
                className="admin-cell-muted admin-col-phone-hide"
                data-label="Topic"
              >
                {page.categoryTitle ?? (
                  <span className="admin-cell-italic-faded">None</span>
                )}
              </td>
              <td data-label="Status">
                <StatusBadge status={page.status} />
              </td>
              <td
                className="admin-cell-muted-sm admin-cell-nowrap"
                data-label="Published"
              >
                {page.dateISO ?? "-"}
              </td>
              <td className="admin-cell-actions" data-label="Preview">
                <Link
                  href={`/${page.slug}`}
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
              <td className="admin-cell-actions" data-label="Actions">
                <Link
                  href={`/admin/pages/${page.id}/edit`}
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
