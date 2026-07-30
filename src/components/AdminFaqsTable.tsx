"use client";

import React, { useCallback, useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import type { Faq } from "@/lib/api";
import AdminSortIcon from "@/components/AdminSortIcon";
import AdminTableToolbar from "@/components/AdminTableToolbar";
import { compareSortValues } from "@/lib/sortUtils";
import { stripHtml } from "@/lib/sanitize";

type Props = {
  faqs: Faq[];
};

type SortCol = "group" | "question" | "sortOrder" | "status";

export default function AdminFaqsTable({ faqs }: Props) {
  const [sortBy, setSortBy] = useState<SortCol>("group");
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const deferredQuery = useDeferredValue(query);

  const groupOptions = useMemo(
    () =>
      Array.from(
        new Set(
          faqs
            .map((faq) => faq.group?.trim())
            .filter((group): group is string => Boolean(group)),
        ),
      )
        .sort((a, b) => a.localeCompare(b))
        .map((group) => ({ label: group, value: group })),
    [faqs],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesQuery =
        !normalizedQuery ||
        [faq.q, stripHtml(faq.a || ""), faq.group ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return (
        matchesQuery &&
        (!statusFilter || faq.status === statusFilter) &&
        (!groupFilter || faq.group === groupFilter)
      );
    });
  }, [deferredQuery, faqs, groupFilter, statusFilter]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
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
  }, [filtered, sortBy, dir]);

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
    if (key === "group") setGroupFilter(value);
  };

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("");
    setGroupFilter("");
  };

  return (
    <div className="admin-table-wrap">
      <AdminTableToolbar
        query={query}
        onQueryChange={setQuery}
        searchLabel="Search FAQs"
        placeholder="Search question, answer, or group"
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
            key: "group",
            label: "Group",
            value: groupFilter,
            options: groupOptions,
          },
        ]}
        onFilterChange={handleFilterChange}
        visibleCount={sorted.length}
        totalCount={faqs.length}
        onClear={clearFilters}
      />
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
                {faqs.length === 0
                  ? "No FAQs found. Create your first FAQ!"
                  : "No FAQs match the current search and filters."}
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
