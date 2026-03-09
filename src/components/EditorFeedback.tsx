"use client";

import React from "react";

type EditorFeedbackProps = {
  /** Success message to display (null/undefined = hidden) */
  message?: string | null;
  /** Error message to display (null/undefined = hidden) */
  error?: string | null;
};

/**
 * Shared success / error feedback banners for admin content editors.
 * Renders nothing when both props are absent or falsy.
 */
export default function EditorFeedback({
  message,
  error,
}: EditorFeedbackProps) {
  return (
    <>
      {message && (
        <div className="admin-feedback admin-feedback-success">{message}</div>
      )}
      {error && (
        <div role="alert" className="admin-feedback admin-feedback-error">
          {error}
        </div>
      )}
    </>
  );
}
