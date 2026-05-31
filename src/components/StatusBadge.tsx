import React from "react";

type StatusBadgeProps = {
  /** Entity status. Anything other than "published" renders as a draft badge. */
  status?: string;
};

/**
 * Shared published / draft status badge used across admin tables and the
 * menu manager. Keeps badge markup and styling consistent in one place.
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  const published = status === "published";
  return (
    <span
      className={`admin-badge ${published ? "admin-badge-published" : "admin-badge-draft"}`}
    >
      {published ? "Published" : "Draft"}
    </span>
  );
}
