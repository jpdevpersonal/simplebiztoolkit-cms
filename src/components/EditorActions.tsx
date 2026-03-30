"use client";

import React from "react";
import Link from "next/link";

type EditorActionsProps = {
  /** True while the save API call is in-flight */
  saving: boolean;
  /** True when creating a new record (no existing id) */
  isCreateMode: boolean;
  /** Entity noun used in button labels, e.g. "Product" or "Page" */
  entityName: string;
  /** Called when the Cancel button is clicked */
  onCancel: () => void;
  /** When provided, a Delete button is shown in edit mode */
  onDelete?: () => void;
  /** True while the delete API call is in-flight */
  deleting?: boolean;
  /** Optional preview link href to open the page being edited in a new tab */
  previewHref?: string;
  /** Optional label for the preview link (defaults to "Preview") */
  previewLabel?: string;
};

/**
 * Shared save / cancel / delete action bar for admin content editors.
 *
 * - In create mode: shows "Create {entityName}" / "Cancel".
 * - In edit mode: shows "Save Changes" / "Cancel" and, when `onDelete` is
 *   supplied, a "Delete {entityName}" danger button.
 */
export default function EditorActions({
  saving,
  isCreateMode,
  entityName,
  onCancel,
  onDelete,
  deleting = false,
  previewHref,
  previewLabel = "Preview",
}: EditorActionsProps) {
  const saveLabel = saving
    ? isCreateMode
      ? "Creating..."
      : "Saving..."
    : isCreateMode
      ? `Create ${entityName}`
      : "Save Changes";

  return (
    <div className="admin-form-actions">
      <div className="admin-form-actions-primary">
        <button type="submit" className="admin-btn-save" disabled={saving}>
          {saveLabel}
        </button>
        <button
          type="button"
          className="admin-btn-cancel"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        {previewHref && (
          <Link
            href={previewHref}
            className="admin-btn-preview"
            target="_blank"
            rel="noopener noreferrer"
          >
            {previewLabel}
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
        )}
      </div>
      {!isCreateMode && onDelete && (
        <button
          type="button"
          className="admin-btn-danger"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : `Delete ${entityName}`}
        </button>
      )}
    </div>
  );
}
