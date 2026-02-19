"use client";

import React from "react";

type EditorActionsProps = {
  /** True while the save API call is in-flight */
  saving: boolean;
  /** True when creating a new record (no existing id) */
  isCreateMode: boolean;
  /** Entity noun used in button labels, e.g. "Product" or "Article" */
  entityName: string;
  /** Called when the Cancel button is clicked */
  onCancel: () => void;
  /** When provided, a Delete button is shown in edit mode */
  onDelete?: () => void;
  /** True while the delete API call is in-flight */
  deleting?: boolean;
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
