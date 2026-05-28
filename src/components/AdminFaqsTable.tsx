"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Faq } from "@/lib/api";
import AdminSortIcon from "@/components/AdminSortIcon";
import { compareSortValues } from "@/lib/sortUtils";
import { stripHtml } from "@/lib/sanitize";

type Props = {
  faqs: Faq[];
};

type SortCol = "group" | "question" | "sortOrder" | "status";

export default function AdminFaqsTable({ faqs }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("group");
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    const copy = [...faqs];
    copy.sort((a, b) => {
      let va: string | number;
      let vb: string | number;

      switch (sortBy) {
        case "question":
          va = (a.q || "").toLowerCase();
          vb = (b.q || "").toLowerCase();
          break;
        case "sortOrder":
          va = a.sortOrder ?? 0;
          vb = b.sortOrder ?? 0;
          break;
        case "status":
          va = a.status ?? "";
          vb = b.status ?? "";
          break;
        case "group":
        default: {
          const ga = (a.group || "").toLowerCase();
          const gb = (b.group || "").toLowerCase();
          if (ga !== gb) return compareSortValues(ga, gb, dir);
          // secondary sort by sortOrder ascending when grouping
          return compareSortValues(a.sortOrder ?? 0, b.sortOrder ?? 0, "asc");
        }
      }

      return compareSortValues(va, vb, dir);
    });
    return copy;
  }, [faqs, sortBy, dir]);

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
                "sortable" + (sortBy === "group" ? " sort-active" : "")
              }
              onClick={() => toggleSort("group")}
            >
              Group
              <AdminSortIcon active={sortBy === "group"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "question" ? " sort-active" : "")
              }
              onClick={() => toggleSort("question")}
            >
              Question
              <AdminSortIcon active={sortBy === "question"} dir={dir} />
            </th>
            <th
              className={
                "sortable" + (sortBy === "sortOrder" ? " sort-active" : "")
              }
              onClick={() => toggleSort("sortOrder")}
            >
              Order
              <AdminSortIcon active={sortBy === "sortOrder"} dir={dir} />
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
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-empty-state">
                No FAQs found. Create your first FAQ!
              </td>
            </tr>
          )}
          {sorted.map((faq) => {
            const answerPreview = stripHtml(faq.a || "").slice(0, 120);
            return (
              <tr key={faq.id}>
                <td className="admin-cell-muted" data-label="Group">
                  {faq.group || "—"}
                </td>
                <td className="admin-cell-strong" data-label="Question">
                  <div>{faq.q}</div>
                  {answerPreview && (
                    <div
                      className="admin-cell-muted-sm"
                      style={{ marginTop: 4 }}
                    >
                      {answerPreview}
                      {(faq.a || "").length > 120 ? "…" : ""}
                    </div>
                  )}
                </td>
                <td
                  className="admin-cell-muted admin-cell-nowrap"
                  data-label="Order"
                >
                  {faq.sortOrder}
                </td>
                <td data-label="Status">
                  <span
                    className={
                      "admin-badge " +
                      (faq.status === "published"
                        ? "admin-badge-published"
                        : "admin-badge-draft")
                    }
                  >
                    {faq.status}
                  </span>
                </td>
                <td className="admin-cell-actions" data-label="Actions">
                  <Link
                    href={`/cms/faqs/${faq.id}/edit`}
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
