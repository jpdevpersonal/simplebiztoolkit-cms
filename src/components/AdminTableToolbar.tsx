"use client";

import { useId } from "react";
import { Search, X } from "lucide-react";

export type AdminTableFilter = {
  key: string;
  label: string;
  value: string;
  options: { label: string; value: string }[];
};

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  searchLabel: string;
  placeholder: string;
  filters?: AdminTableFilter[];
  onFilterChange?: (key: string, value: string) => void;
  visibleCount: number;
  totalCount: number;
  onClear: () => void;
};

export default function AdminTableToolbar({
  query,
  onQueryChange,
  searchLabel,
  placeholder,
  filters = [],
  onFilterChange,
  visibleCount,
  totalCount,
  onClear,
}: Props) {
  const id = useId();
  const hasActiveControls =
    query.trim().length > 0 || filters.some((filter) => filter.value !== "");

  return (
    <div className="admin-table-toolbar">
      <div className="admin-table-toolbar-controls">
        <div className="admin-table-search">
          <Search size={17} aria-hidden="true" />
          <label className="visually-hidden" htmlFor={`${id}-search`}>
            {searchLabel}
          </label>
          <input
            id={`${id}-search`}
            type="search"
            value={query}
            placeholder={placeholder}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        {filters.map((filter) => (
          <div className="admin-table-filter" key={filter.key}>
            <label htmlFor={`${id}-${filter.key}`}>{filter.label}</label>
            <select
              id={`${id}-${filter.key}`}
              value={filter.value}
              onChange={(event) =>
                onFilterChange?.(filter.key, event.target.value)
              }
            >
              <option value="">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="admin-table-toolbar-summary">
        <span aria-live="polite">
          {visibleCount === totalCount
            ? `${totalCount} ${totalCount === 1 ? "item" : "items"}`
            : `${visibleCount} of ${totalCount} items`}
        </span>
        {hasActiveControls ? (
          <button type="button" onClick={onClear}>
            <X size={14} aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
