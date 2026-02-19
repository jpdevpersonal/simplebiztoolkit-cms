"use client";

import React from "react";

type EditorFeedbackProps = {
  /** Success message to display (null/undefined = hidden) */
  message?: string | null;
  /** Error message to display (null/undefined = hidden) */
  error?: string | null;
};

const successStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  background: "#f0fdf4",
  border: "1px solid #86efac",
  borderRadius: "8px",
  color: "#166534",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.75rem",
};

const errorStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  background: "#fff5f5",
  border: "1px solid #fca5a5",
  borderRadius: "8px",
  color: "#dc2626",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.75rem",
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
      {message && <div style={successStyle}>{message}</div>}
      {error && (
        <div role="alert" style={errorStyle}>
          {error}
        </div>
      )}
    </>
  );
}
