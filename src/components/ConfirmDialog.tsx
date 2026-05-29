"use client";

import React from "react";
import AdminModal from "@/components/AdminModal";

type ConfirmDialogProps = {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dialog heading. */
  title: string;
  /** Body message explaining the consequence of the action. */
  message: React.ReactNode;
  /** Label for the confirm button (defaults to "Confirm"). */
  confirmLabel?: string;
  /** Label for the cancel button (defaults to "Cancel"). */
  cancelLabel?: string;
  /** When true, the confirm button uses the danger styling. */
  destructive?: boolean;
  /** Disables the confirm button (e.g. while the action is in-flight). */
  busy?: boolean;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Called when the user cancels or dismisses the dialog. */
  onCancel: () => void;
};

/**
 * Accessible confirmation dialog built on top of AdminModal. Replaces the
 * native `confirm()` browser prompt so destructive admin actions are
 * consistent, styled, and keyboard accessible.
 */
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AdminModal
      isOpen={isOpen}
      onCloseAction={onCancel}
      title={title}
      size="sm"
    >
      <div className="admin-confirm-dialog">
        <p className="admin-confirm-dialog-message">{message}</p>
        <div className="admin-confirm-dialog-actions">
          <button
            type="button"
            className="admin-btn-cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={destructive ? "admin-btn-danger" : "admin-btn-save"}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </AdminModal>
  );
}
